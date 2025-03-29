import React from "react";
import { Button } from "@/components/ui/Button";
import { PlusCircle, Paperclip, XCircle, Download, Loader } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Attachment {
  fileName: string;
  attachmentId: string;
  uploadedBy: string;
  isUploadedByAdmin: boolean;
  fileSize: string;
}

interface Props {
  data: { attachments: Attachment[] } | null;
  uploading: boolean;
  tempUploadingFileName: string | null;
  downloadAttachment: (id: string, name: string) => void;
  removeAttachment: (id: string) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  downloadingAttachmentId: string | null;
  deletingAttachmentId: string | null;
}

const AttachmentsSection: React.FC<Props> = ({
  data,
  uploading,
  tempUploadingFileName,
  downloadAttachment,
  removeAttachment,
  handleFileSelect,
  fileInputRef,
  downloadingAttachmentId,
  deletingAttachmentId,
}) => {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Attachments</h3>

      <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {data?.attachments.map((attachment) => {
          const isDownloading = downloadingAttachmentId === attachment.attachmentId;
          const isDeleting = deletingAttachmentId === attachment.attachmentId;

          return (
            <div
              key={attachment.attachmentId}
              className="relative flex-shrink-0 w-32 h-32 bg-white border rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <div className="absolute top-2 right-2 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAttachment(attachment.attachmentId)}
                  disabled={uploading || isDeleting}
                >
                  {isDeleting ? (
                    <Loader className="w-4 h-4 animate-spin text-gray-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-500 hover:text-red-500 transition-colors" />
                  )}
                </Button>
              </div>
              <div className="flex flex-col items-center justify-center h-full px-2">
                <Paperclip className="h-8 w-8 text-gray-400 mb-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    downloadAttachment(attachment.attachmentId, attachment.fileName)
                  }
                  disabled={isDownloading}
                  className="hover:bg-transparent"
                >
                  {isDownloading ? (
                    <Loader className="w-4 h-4 animate-spin text-gray-500" />
                  ) : (
                    <Download className="w-4 h-4 text-gray-500 hover:text-blue-500 transition-colors" />
                  )}
                </Button>
                <p className="text-xs text-center text-gray-600 mt-1 truncate w-full">
                  {attachment.fileName}
                </p>
              </div>
            </div>
          );
        })}

        {/* Add File */}
        {data?.attachments?.length < 5 && (
          <div className="flex-shrink-0 w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center hover:bg-gray-50 cursor-pointer transition-all">
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <PlusCircle className="h-6 w-6 text-gray-400" />
              <span className="text-xs text-gray-500 mt-1">Add File</span>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.txt,.xls,.xlsx"
                disabled={uploading}
                ref={fileInputRef}
              />
            </label>
          </div>
        )}

        {/* Uploading Loader */}
        {uploading && tempUploadingFileName && (
          <div className="relative flex-shrink-0 w-32 h-32 bg-white border rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
            <Loader className="h-5 w-5 animate-spin text-gray-500 mb-1" />
            <p className="text-xs text-gray-600 px-2 truncate w-full">
              {tempUploadingFileName}
            </p>
            <span className="text-[10px] text-gray-400 mt-1">Uploading...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttachmentsSection;
