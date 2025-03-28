import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { getStorage } from "firebase-admin/storage";
import { v4 as uuidv4 } from "uuid";
import {
  validateWeekStartDate,
  validateYearAndMonth,
} from "@/lib/timesheet/utils";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const db = getFirestore(); // Initialize Firestore here, outside the function
const MAX_ACTIVITY_LOG_SIZE = 10;
const MAX_ATTACHMENTS = 5; // Limit the number of attachments

// Function to sanitize filename
function sanitizeFilename(filename: string): string {
  const maxLength = 100; // Maximum length of the filename
  const allowedChars = /^[a-zA-Z0-9._-]+$/; // Allowed characters
  const sanitized = filename
    .replace(/[^a-zA-Z0-9._-]+/g, "_") // Replace invalid characters with underscores
    .slice(0, maxLength); // Truncate to max length

  if (sanitized.length < 3) {
    throw new Error("Sanitized filename must be at least 3 characters long.");
  }

  if (!allowedChars.test(sanitized)) {
    throw new Error("Sanitized filename contains invalid characters.");
  }

  return sanitized;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (example)
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/vnd.ms-excel", // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];

export async function POST(request: Request) {
  let uploadedFileRef: any = null; // Declare here for cleanup in case of failure

  try {
    // Get the authorization token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];

    let decodedToken;
    try {
      // Verify the token
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      console.error("Error verifying token:", error);
      return NextResponse.json(
        { message: "Invalid or expired token." },
        { status: 403 }
      );
    }

    let employeeId: string | undefined;
    let isAdmin: boolean | undefined;
    let updatedBy: string;

    try {
      const tokenUser = await adminAuth.getUser(decodedToken.uid);
      employeeId = tokenUser.customClaims?.employeeId as string | undefined; // Explicitly cast to string | undefined
      isAdmin = tokenUser.customClaims?.isAdmin as boolean | false;
      updatedBy = tokenUser.displayName || tokenUser.email || "Unknown User";
    } catch (error) {
      console.error("Error getting employeeId:", error);
      return NextResponse.json(
        { message: "Invalid or expired token. EmployeeId not found" },
        { status: 403 }
      );
    }

    if (!employeeId || employeeId.trim() === "") {
      return NextResponse.json(
        { message: "Employee ID is missing or invalid" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file: File | null = formData.get("file") as unknown as File;
    const weekStartDate = formData.get("week-start") as string | null;
    const year = formData.get("year") as string | null;
    const month = formData.get("month") as string | null;

    if (!file) {
      return NextResponse.json(
        { message: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!weekStartDate || !year || !month) {
      return NextResponse.json(
        { message: "Missing required inputs" },
        { status: 400 }
      );
    }

    try {
      validateWeekStartDate(weekStartDate);
      validateYearAndMonth(year, month);
    } catch (error) {
      console.error("Invalid inputs:", error);
      return NextResponse.json(
        { message: "Invalid inputs detected | " + error },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          message: `File size exceeds the maximum limit of ${
            MAX_FILE_SIZE / (1024 * 1024)
          } MB`,
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          message:
            "Invalid file type. Allowed types are: PDF, TXT, CSV, XLS, XLSX, DOC, DOCX",
        },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const originalFileName = file.name; // Store original filename
    let sanitizedFileName: string;
    try {
      sanitizedFileName = sanitizeFilename(originalFileName);
    } catch (error: any) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    // **CHECK TIMESHEET DATA FIRST**
    const timesheetRef = db
      .collection("timesheets")
      .doc(employeeId)
      .collection(year)
      .doc(month);

    let timesheetDoc;
    try {
      timesheetDoc = await timesheetRef.get();
    } catch (firestoreError: any) {
      console.error("Error getting timesheet document:", firestoreError);
      return NextResponse.json(
        {
          message: "Error retrieving timesheet data. Please try again.",
          error: firestoreError.message,
        },
        { status: 500 }
      );
    }

    const existingWeekData = timesheetDoc.data() || {};
    const existingWeekStartDateData =
      existingWeekData[weekStartDate] || undefined;

    if (!existingWeekStartDateData) {
      return NextResponse.json(
        {
          message:
            "No timesheet information found for the week. Please submit timesheet and try again.",
        },
        { status: 400 } // Or 404, depending on your API design
      );
    }

    const storage = getStorage();
    const bucket = storage.bucket();

    // Generate a unique UUID for the file
    const attachmentId = uuidv4();

    // Construct the file path in Firebase Storage using the UUID
    const filePath = `timesheet_attachments/${employeeId}/${weekStartDate}/${attachmentId}`;
    uploadedFileRef = bucket.file(filePath);

    try {
      await uploadedFileRef.save(Buffer.from(buffer), {
        metadata: {
          contentType: file.type,
          customMetadata: {
            originalName: originalFileName, //Keep original name for reference
            weekStart: weekStartDate,
            uploadedBy: updatedBy,
            fileSize: file.size.toString(), // Add file size to metadata
          },
        },
        public: false, // Make file private
      });

      const [metadata] = await uploadedFileRef.getMetadata();

      try {
        await saveAttachmentDetailsInTimesheet(
          employeeId,
          year,
          month,
          weekStartDate,
          updatedBy,
          isAdmin,
          attachmentId, // Store UUID instead of file path
          originalFileName, // Store original filename
          metadata,
          timesheetDoc, // Pass the timesheetDoc
          file.size.toString()
        );
      } catch (e: any) {
        console.error("Error saving attachment details to timesheet:", e);
        // **CLEANUP: Delete the uploaded file**
        try {
          await uploadedFileRef.delete();
          console.log("Successfully deleted uploaded file due to error.");
        } catch (deleteError: any) {
          console.error("Failed to delete uploaded file:", deleteError);
          // Log this more thoroughly; manual intervention might be needed.
        }

        return NextResponse.json(
          {
            message: "Error saving attachment. Please try again.",
            error: e.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "File uploaded successfully",
        attachmentId: attachmentId, // Return the file UUID
        fileName: originalFileName, // Return the original file name
      });
    } catch (error: any) {
      console.error("Error uploading file:", error);

      // **CLEANUP: Attempt to delete the file if upload failed**
      if (uploadedFileRef) {
        try {
          await uploadedFileRef.delete();
          console.log("Successfully deleted partially uploaded file.");
        } catch (deleteError: any) {
          console.error(
            "Failed to delete partially uploaded file:",
            deleteError
          );
          // Log this more thoroughly; manual intervention might be needed.
        }
      }

      return NextResponse.json(
        {
          message: "Error uploading file to Firebase Storage.",
          error: error.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Internal server error:", error);
    return NextResponse.json(
      {
        message: "Internal server error. Try again later.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

async function saveAttachmentDetailsInTimesheet(
  employeeId: string,
  year: string,
  month: string,
  weekStartDate: string,
  updatedBy: string,
  isAdmin: boolean,
  attachmentId: string, // Store the file UUID
  fileName: string, // Store the original file name
  metadata,
  timesheetDoc, // Receive the timesheetDoc
  fileSize: string
): Promise<void> {
  try {
    const timesheetRef = db
      .collection("timesheets")
      .doc(employeeId)
      .collection(year)
      .doc(month);

    let attachmentInfo = {
      fileName: fileName, // Store original filename
      attachmentId: attachmentId, // Store the file UUID
    };

    const weekData = {
      attachments: await updateAttachments(
        timesheetRef,
        weekStartDate,
        updatedBy,
        isAdmin,
        fileName,
        attachmentInfo,
        timesheetDoc,
        fileSize
      ),
      activityLog: await updateActivityLog(
        timesheetRef,
        weekStartDate,
        updatedBy,
        isAdmin,
        fileName,
        timesheetDoc // Pass the timesheetDoc
      ),
    };

    await timesheetRef.set({ [weekStartDate]: weekData }, { merge: true });

    console.log("Attachment details saved successfully!");
  } catch (error: any) {
    console.error("Error saving attachment details:", error);
    throw error;
  }
}

async function updateActivityLog(
  timesheetRef: any,
  weekStartDate: string,
  updatedBy: string,
  isAdmin: boolean,
  fileName: string,
  timesheetDoc // Receive the timesheetDoc
): Promise<any[]> {
  const existingWeekData = timesheetDoc.data() || {};
  const existingWeekStartDateData =
    existingWeekData[weekStartDate] || undefined;

  let activityLog = existingWeekStartDateData?.activityLog || [];

  const action = `Attachment ${fileName} uploaded`;

  const newActivity = {
    timestamp: new Date().toISOString(),
    updatedBy: updatedBy,
    isUpdatedByAdmin: isAdmin,
    action: action,
  };

  activityLog.push(newActivity);

  if (activityLog.length > MAX_ACTIVITY_LOG_SIZE) {
    activityLog.shift();
  }

  return activityLog;
}

async function updateAttachments(
  timesheetRef: any,
  weekStartDate: string,
  updatedBy: string,
  isAdmin: boolean,
  fileName: string,
  attachmentInfo: any,
  timesheetDoc,
  fileSize
): Promise<any> {
  const existingWeekData = timesheetDoc.data() || {};
  const existingWeekStartDateData =
    existingWeekData[weekStartDate] || undefined;

  // Use an object (map) instead of an array:
  let attachments = existingWeekStartDateData?.attachments || [];

  attachmentInfo.uploadedBy = updatedBy;
  attachmentInfo.isUploadedByAdmin = isAdmin;
  attachmentInfo.fileSize = fileSize;

  if (attachments.length >= MAX_ATTACHMENTS) {
    throw new Error(
      "Max attachments for the current timesheet is reached. Try deleting unused or older attachments to upload new one"
    );
  }

  attachments.push(attachmentInfo);
  return attachments; // Return the attachments object
}

// New API endpoint to securely serve the file
export async function GET(request: Request) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];

    let decodedToken;
    try {
      // Verify the token
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      console.error("Error verifying token:", error);
      return NextResponse.json(
        { message: "Invalid or expired token." },
        { status: 403 }
      );
    }

    let employeeId: string | undefined;

    try {
      const tokenUser = await adminAuth.getUser(decodedToken.uid);
      employeeId = tokenUser.customClaims?.employeeId as string | undefined; // Explicitly cast to string | undefined
    } catch (error) {
      console.error("Error getting employeeId:", error);
      return NextResponse.json(
        { message: "Invalid or expired token. EmployeeId not found" },
        { status: 403 }
      );
    }

    if (!employeeId || employeeId.trim() === "") {
      return NextResponse.json(
        { message: "Employee ID is missing or invalid" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get("attachmentId");
    const weekStartDate = searchParams.get("weekStart");

    if (!attachmentId || !weekStartDate) {
      return NextResponse.json(
        { message: "Missing required query parameters" },
        { status: 400 }
      );
    }

    // Reconstruct the file path using the UUID
    const filePath = `timesheet_attachments/${employeeId}/${weekStartDate}/${attachmentId}`;

    const storage = getStorage();
    const bucket = storage.bucket();
    const file = bucket.file(filePath);

    try {
      const [exists] = await file.exists();
      if (!exists) {
        return NextResponse.json(
          { message: "File not found" },
          { status: 404 }
        );
      }

      // Generate a signed URL for secure access
      const [url] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 60 * 60 * 1000, // URL valid for 1 hour
      });

      // Redirect the user to the signed URL
      return NextResponse.redirect(url, 302);

      // Alternatively, if you want to stream the file content directly:
      // const [buffer] = await file.download();
      // return new NextResponse(buffer, {
      //   headers: {
      //     'Content-Type': 'application/octet-stream', // Adjust content type as needed
      //     'Content-Disposition': `attachment; filename="${fileName}"`,
      //   },
      // });
    } catch (error: any) {
      console.error("Error retrieving file:", error);
      return NextResponse.json(
        { message: "Error retrieving file" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Internal server error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
    try {
        // Get the authorization token
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { message: "Missing or invalid authorization header" },
                { status: 401 }
            );
        }

        const token = authHeader.split("Bearer ")[1];

        let decodedToken;
        try {
            // Verify the token
            decodedToken = await adminAuth.verifyIdToken(token);
        } catch (error) {
            console.error("Error verifying token:", error);
            return NextResponse.json(
                { message: "Invalid or expired token." },
                { status: 403 }
            );
        }

        let employeeId: string | undefined;
        let isAdmin: boolean | undefined;
        let updatedBy: string;

        try {
            const tokenUser = await adminAuth.getUser(decodedToken.uid);
            employeeId = tokenUser.customClaims?.employeeId as string | undefined;
            isAdmin = tokenUser.customClaims?.isAdmin as boolean | false;
            updatedBy = tokenUser.displayName || tokenUser.email || "Unknown User";
        } catch (error) {
            console.error("Error getting employeeId:", error);
            return NextResponse.json(
                { message: "Invalid or expired token. EmployeeId not found" },
                { status: 403 }
            );
        }

        if (!employeeId || employeeId.trim() === "") {
            return NextResponse.json(
                { message: "Employee ID is missing or invalid" },
                { status: 400 }
            );
        }

        const { searchParams } = new URL(request.url);
        const attachmentId = searchParams.get("attachmentId");
        const weekStartDate = searchParams.get("weekStart");
        const year = searchParams.get("year");
        const month = searchParams.get("month");

        if (!attachmentId || !weekStartDate || !year || !month) {
            return NextResponse.json(
                { message: "Missing required query parameters" },
                { status: 400 }
            );
        }

        // Reconstruct the file path using the UUID
        const filePath = `timesheet_attachments/${employeeId}/${weekStartDate}/${attachmentId}`;

        const storage = getStorage();
        const bucket = storage.bucket();
        const file = bucket.file(filePath);

        try {
            const [exists] = await file.exists();
            if (!exists) {
                return NextResponse.json(
                    { message: "File not found" },
                    { status: 404 }
                );
            }

            await file.delete();
            console.log("File deleted successfully:", filePath);


            //Also remove attachment details from the Timesheet
            try {
                 const timesheetRef = db
                    .collection("timesheets")
                    .doc(employeeId)
                    .collection(year)
                    .doc(month);

                const timesheetDoc = await timesheetRef.get();
                if (!timesheetDoc.exists) {
                     return NextResponse.json(
                        { message: "Timesheet document not found" },
                        { status: 404 }
                    );
                }

                 const existingWeekData = timesheetDoc.data() || {};
                 const existingWeekStartDateData = existingWeekData[weekStartDate] || {};
                 let attachments = existingWeekStartDateData?.attachments || [];
                 let activityLog = existingWeekStartDateData?.activityLog || [];

                // Filter out the deleted attachment
                attachments = attachments.filter((attachment: any) => attachment.attachmentId !== attachmentId);

                //Update the activity log
                const action = `Attachment deleted`;

                const newActivity = {
                    timestamp: new Date().toISOString(),
                    updatedBy: updatedBy,
                    isUpdatedByAdmin: isAdmin,
                    action: action,
                };

                activityLog.push(newActivity);

                if (activityLog.length > MAX_ACTIVITY_LOG_SIZE) {
                    activityLog.shift();
                }


                 await timesheetRef.set(
                        {
                            [weekStartDate]: {
                                ...existingWeekStartDateData, // Keep other data
                                attachments: attachments, // Update attachments
                                activityLog: activityLog,
                            },
                        },
                        { merge: true }
                    );


            } catch (dbError: any) {
                console.error("Error updating Firestore after file deletion:", dbError);
                 return NextResponse.json(
                        {
                            message: "File deleted from storage but failed to update timesheet.",
                            storageSuccess: true,
                            dbError: dbError.message,
                        },
                        { status: 500 }
                    );
            }


            return NextResponse.json({
                success: true,
                message: "File deleted successfully",
            });

        } catch (error: any) {
            console.error("Error deleting file:", error);
            return NextResponse.json(
                { message: "Error deleting file" },
                { status: 500 }
            );
        }

    } catch (error: any) {
        console.error("Internal server error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}