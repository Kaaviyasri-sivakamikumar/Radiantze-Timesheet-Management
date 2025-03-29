import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { adminAuth } from "@/lib/firebase/admin";
import { ForbiddenError } from "../timesheet/week/route";

// Initialize Firestore
const db = getFirestore();

// Define Entity Types
enum EntityType {
  VENDOR = "vendor",
  CLIENT = "client",
  VISA = "visa",
}

// Define Interfaces for Vendor, Client, and Visa
interface VendorEntity {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface ClientEntity {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface VisaEntity {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Type to represent either a Vendor, Client, or Visa entity
type Entity = VendorEntity | ClientEntity | VisaEntity;

const ENTITY_COLLECTION = "entities"; // Generic collection name
const MAX_NAME_LENGTH = 50;

// Helper function to generate a unique ID
function generateId(entityType: EntityType): string {
  switch (entityType) {
    case EntityType.VENDOR:
      return `VENDOR_${Date.now().toString()}`;
    case EntityType.CLIENT:
      return `CLIENT_${Date.now().toString()}`;
    case EntityType.VISA:
      return `VISA_${Date.now().toString()}`;
    default:
      return Date.now().toString();
  }
}

// Authentication middleware (reusing from your existing code, adapt as needed)
async function authenticateUser(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new ForbiddenError("Missing or invalid authorization header");
  }

  const token = authHeader.split("Bearer ")[1];
  let decodedToken;

  try {
    decodedToken = await adminAuth.verifyIdToken(token);
  } catch (error) {
    console.error("Error verifying token:", error);
    throw new ForbiddenError("Invalid or expired token.");
  }

  try {
    return await adminAuth.getUser(decodedToken.uid);
  } catch (error) {
    console.error("Error fetching admin user:", error);
    throw new ForbiddenError("Error retrieving admin user details.");
  }
}

// --- CRUD Operations (Generic) ---

// Helper function to validate entity type
function validateEntityType(entityType: string): EntityType {
  console.log(entityType);
  const entityValues = Object.values(EntityType).filter(
    (v) => typeof v === 'string'
  ) as string[];

  if (!entityValues.includes(entityType)) {
    throw new Error(`Invalid entity type: ${entityType}`);
  }

  return entityType as EntityType;
}

async function checkIfNameExists(
  entityType: EntityType,
  name: string,
  existingId?: string // Optional ID to exclude during update
): Promise<boolean> {
  const nameToCompare = name.toLowerCase().replace(/\s/g, "");
  const collectionRef = db
    .collection(ENTITY_COLLECTION)
    .doc(entityType)
    .collection("items");

  let query = collectionRef.where("nameToCompare", "==", nameToCompare);

  if (existingId) {
    query = query.where("id", "!=", existingId); // Exclude the current entity during update
  }

  const snapshot = await query.get();
  return !snapshot.empty;
}

// 1. GET: Retrieve an Entity by ID or All Entities
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("type"); // e.g., "vendor", "client", "visa"
  const entityId = searchParams.get("id");

  if (!entityType) {
    return NextResponse.json(
      { message: "Entity type is required." },
      { status: 400 }
    );
  }

  try {
    const validatedEntityType = validateEntityType(entityType);
    if (entityId) {
      return getEntityById(request, validatedEntityType, entityId);
    } else {
      return getAllEntities(request, validatedEntityType);
    }
  } catch (error: any) {
    return handleErrorResponse(error);
  }
}

function handleErrorResponse(error: any) {
  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 401 }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }
  return NextResponse.json(
    {
      success: false,
      message: "Internal server error. Contact Administrator.",
      error: error?.message || "Unknown error",
    },
    { status: 500 }
  );
}

async function getEntityById(
  request: Request,
  entityType: EntityType,
  entityId: string
) {
  try {
    const tokenUser = await authenticateUser(request);

    if (!entityId) {
      return NextResponse.json(
        { message: "Entity ID is required." },
        { status: 400 }
      );
    }

    const entityDoc = await db
      .collection(ENTITY_COLLECTION)
      .doc(entityType)
      .collection("items")
      .doc(entityId)
      .get();

    if (!entityDoc.exists) {
      return NextResponse.json(
        { message: "Entity not found." },
        { status: 404 }
      );
    }

    const entityData = entityDoc.data() as Entity; // Type assertion

    if (!entityData) {
      return NextResponse.json(
        { message: "Entity data is empty." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, entity: entityData });
  } catch (error: any) {
    console.error("Error retrieving entity:", error);
    return handleErrorResponse(error);
  }
}

async function getAllEntities(request: Request, entityType: EntityType) {
  try {
    const tokenUser = await authenticateUser(request);

    const entityCollection = await db
      .collection(ENTITY_COLLECTION)
      .doc(entityType)
      .collection("items")
      .get();

    const entities: Entity[] = [];

    entityCollection.forEach((doc) => {
      const entity = doc.data() as Entity;
      entities.push(entity);
    });

    return NextResponse.json({ success: true, entities: entities });
  } catch (error: any) {
    console.error("Error retrieving all entities:", error);
    return handleErrorResponse(error);
  }
}

// 2. POST: Create a new Entity
export async function POST(request: Request) {
  try {
    const tokenUser = await authenticateUser(request);
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("type"); // e.g., "vendor", "client", "visa"

    if (!entityType) {
      return NextResponse.json(
        { message: "Entity type is required." },
        { status: 400 }
      );
    }

    try {
      const validatedEntityType = validateEntityType(entityType);

      if (!body.name) {
        return NextResponse.json(
          { message: "Name is required." },
          { status: 400 }
        );
      }

      if (body.name.length > MAX_NAME_LENGTH) {
        return NextResponse.json(
          { message: `Name cannot exceed ${MAX_NAME_LENGTH} characters.` },
          { status: 400 }
        );
      }

      const nameExists = await checkIfNameExists(
        validatedEntityType,
        body.name
      );
      if (nameExists) {
        return NextResponse.json(
          { message: "Name already exists." },
          { status: 409 } // 409 Conflict
        );
      }

      let newEntity: Entity;
      if (validatedEntityType === EntityType.VENDOR) {
        newEntity = {
          id: generateId(validatedEntityType),
          name: body.name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as VendorEntity;
      } else if (validatedEntityType === EntityType.CLIENT) {
        newEntity = {
          id: generateId(validatedEntityType),
          name: body.name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as ClientEntity;
      } else if (validatedEntityType === EntityType.VISA) {
        newEntity = {
          id: generateId(validatedEntityType),
          name: body.name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as VisaEntity;
      } else {
        throw new Error("Invalid entity type."); // Should not happen due to validation
      }

      // Before setting, add a field to make comparisons easier
      (newEntity as any).nameToCompare = body.name
        .toLowerCase()
        .replace(/\s/g, "");

      // Add the new entity to Firestore
      await db
        .collection(ENTITY_COLLECTION)
        .doc(validatedEntityType)
        .collection("items")
        .doc(newEntity.id)
        .set(newEntity);

      return NextResponse.json({
        success: true,
        message: "Entity created successfully.",
        entity: newEntity,
      });
    } catch (error: any) {
      return handleErrorResponse(error)
    }
  } catch (error: any) {
    console.error("Error creating entity:", error);
    return handleErrorResponse(error);
  }
}

// 3. PUT: Update an existing Entity
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenUser = await authenticateUser(request);
    const entityType = searchParams.get("type");
    const entityId = searchParams.get("id");

    if (!entityType) {
      return NextResponse.json(
        { message: "Entity type is required." },
        { status: 400 }
      );
    }

    if (!entityId) {
      return NextResponse.json(
        { message: "Entity ID is required." },
        { status: 400 }
      );
    }

    try {
      const validatedEntityType = validateEntityType(entityType);
      const body = await request.json();

      if (!body.name) {
        return NextResponse.json(
          { message: "Name is required." },
          { status: 400 }
        );
      }

      if (body.name.length > MAX_NAME_LENGTH) {
        return NextResponse.json(
          { message: `Name cannot exceed ${MAX_NAME_LENGTH} characters.` },
          { status: 400 }
        );
      }

      // Manually check if name exists without Firestore indexes
      const nameExists = await checkIfNameExistsWithoutIndex(
        validatedEntityType,
        body.name,
        entityId
      );

      if (nameExists) {
        return NextResponse.json(
          { message: "Name already exists." },
          { status: 409 }
        );
      }

      const entityRef = db
        .collection(ENTITY_COLLECTION)
        .doc(validatedEntityType)
        .collection("items")
        .doc(entityId);

      const entityDoc = await entityRef.get();

      if (!entityDoc.exists) {
        return NextResponse.json(
          { message: "Entity not found." },
          { status: 404 }
        );
      }

      // Prepare update data
      const updateData: Partial<Entity> = {
        name: body.name, // Only update name and updatedAt
        updatedAt: new Date().toISOString(),
        nameToCompare: body.name.toLowerCase().replace(/\s/g, ""), // Store processed name
      };

      await entityRef.update(updateData);

      return NextResponse.json({
        success: true,
        message: "Entity updated successfully.",
        entityId: entityId,
      });
    } catch (error: any) {
      return handleErrorResponse(error)
    }
  } catch (error: any) {
    console.error("Error updating entity:", error);
    return handleErrorResponse(error);
  }
}
async function checkIfNameExistsWithoutIndex(
  entityType: string,
  name: string,
  entityId: string
): Promise<boolean> {
  const snapshot = await db
    .collection(ENTITY_COLLECTION)
    .doc(entityType)
    .collection("items")
    .get(); // Fetch all documents

  const nameToCompare = name.toLowerCase().replace(/\s/g, "");

  // Manually filter to check for duplicate names
  return snapshot.docs.some((doc) => {
    const data = doc.data();
    return (
      data.nameToCompare === nameToCompare && doc.id !== entityId // Exclude the current entity ID
    );
  });
}

// 4. DELETE: Delete an Entity
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenUser = await authenticateUser(request);
    const entityType = searchParams.get("type");
    const entityId = searchParams.get("id");

    if (!entityType) {
      return NextResponse.json(
        { message: "Entity type is required." },
        { status: 400 }
      );
    }

    if (!entityId) {
      return NextResponse.json(
        { message: "Entity ID is required." },
        { status: 400 }
      );
    }

    try {
      const validatedEntityType = validateEntityType(entityType);

      const entityDoc = await db
        .collection(ENTITY_COLLECTION)
        .doc(validatedEntityType)
        .collection("items")
        .doc(entityId)
        .get();

      if (!entityDoc.exists) {
        return NextResponse.json(
          { message: "Entity not found." },
          { status: 404 }
        );
      }

      await db
        .collection(ENTITY_COLLECTION)
        .doc(validatedEntityType)
        .collection("items")
        .doc(entityId)
        .delete();

      return NextResponse.json({
        success: true,
        message: "Entity deleted successfully.",
        entityId: entityId,
      });
    } catch (error: any) {
      return handleErrorResponse(error)
    }
  } catch (error: any) {
    console.error("Error deleting entity:", error);
    return handleErrorResponse(error);
  }
}
