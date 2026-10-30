import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Upload, X } from "lucide-react";
import { formatSize } from "~/lib/utils";
interface FileUploaderProps {
  onFileSelect?: (file: File | null) => void;
}
const FileUploader = ({ onFileSelect }: FileUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0] || null;
      setFile(file);
      onFileSelect?.(file);
    },
    [onFileSelect]
  );

  const maxFileSize = 20 * 1024 * 1024;
  const { getRootProps, getInputProps, isDragActive } =
    useDropzone({
      onDrop,
      multiple: false,
      accept: { "application/pdf": [".pdf"] },
      maxSize: maxFileSize,
    });

  return (
    <div className="w-full gradient-border">
      <div {...getRootProps({ className: "uploader-drag-area", "aria-label": "Upload Resume" })} data-drag-active={isDragActive} data-has-file={Boolean(file)}>
        <input {...getInputProps({ id: "uploader" })} />
        <div className="space-y-4 cursor-pointer">
          {file ? (
            <div
              className="uploader-selected-file"
              onClick={(e) => e.stopPropagation()}
            >
              <FileText className="size-8 shrink-0 text-muted" aria-hidden="true" />
              <div className="flex items-center space-x-3">
                <div>
                  <p className="text-sm font-medium text-ink break-all">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatSize(file.size)}
                  </p>
                </div>
              </div>
              <button type="button" aria-label="Remove file" className="p-2 cursor-pointer rounded-lg" onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                onFileSelect?.(null);
              }}>
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div>
              <div className="mx-auto size-12 flex items-center justify-center mb-4 rounded-panel bg-surface text-muted">
                <Upload className="size-6" aria-hidden="true" />
              </div>
              <p className="text-lg text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>
              <p className="text-lg text-gray-500">
                PDF (max {formatSize(maxFileSize)})
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
