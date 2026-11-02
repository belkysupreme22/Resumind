import { useId, useState } from "react";
import { useDropzone } from "react-dropzone";
import { CircleAlert, FileText, Upload, X } from "lucide-react";
import { formatSize } from "~/lib/utils";

const FileUploader = ({ file, onFileSelect }: {
  file: File | null;
  onFileSelect: (file: File | null) => void;
}) => {
  const [error, setError] = useState("");
  const hintId = useId();
  const errorId = useId();
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    noClick: true,
    noKeyboard: true,
    multiple: false,
    accept: { "application/pdf": [".pdf"] },
    maxSize: 20 * 1024 * 1024,
    validator: (candidate) => candidate.size === 0 ? { code: "file-empty", message: "This file is empty. Choose a PDF with your resume." } : null,
    onDropAccepted: ([accepted]) => {
      setError("");
      onFileSelect(accepted);
    },
    onDropRejected: (rejections) => {
      const codes = rejections.flatMap((rejection) => rejection.errors.map((item) => item.code));
      setError(codes.includes("too-many-files") ? "Choose one resume at a time."
        : codes.includes("file-too-large") ? "This file is over 20 MB. Choose a smaller PDF."
        : codes.includes("file-empty") ? "This file is empty. Choose a PDF with your resume."
        : "Choose a PDF file. Other file types aren’t supported.");
    },
  });

  return (
    <div className="resume-upload-field">
      <div {...getRootProps({ className: "gradient-border", role: "presentation" })}>
        <input {...getInputProps({ id: "uploader", "aria-label": "Choose a PDF resume" })} />
        {file ? (
          <div className="uploader-selected-file">
            <FileText size={32} className="shrink-0 text-muted" aria-hidden="true" />
            <div><p className="text-sm font-medium break-all">{file.name}</p><p className="text-sm text-muted">{formatSize(file.size)}</p></div>
            <button type="button" className="text-button" onClick={open}>Replace</button>
            <button type="button" aria-label="Remove file" className="icon-button" onClick={() => { setError(""); onFileSelect(null); }}><X size={16} aria-hidden="true" /></button>
          </div>
        ) : (
          <button type="button" className="uploader-drag-area w-full" data-drag-active={isDragActive} onClick={open} aria-describedby={`${hintId}${error ? ` ${errorId}` : ""}`}>
            <span className="uploader-symbol"><Upload size={24} aria-hidden="true" /></span>
            <span className="uploader-title">{isDragActive ? "Drop your PDF here" : "Choose a PDF or drop it here"}</span>
            <span className="uploader-hint" id={hintId}>One resume, up to 20 MB</span>
          </button>
        )}
      </div>
      {error && <p className="field-error" id={errorId} role="alert"><CircleAlert size={16} aria-hidden="true" />{error}{file && " Your previously selected file is still ready."}</p>}
    </div>
  );
};

export default FileUploader;
