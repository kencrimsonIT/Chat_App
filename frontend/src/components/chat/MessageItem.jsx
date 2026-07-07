import React from "react";
import { FileText, Download } from "lucide-react";

const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const getFileExtension = (fileName) => {
    if (!fileName) return "";
    const parts = fileName.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "";
};

const MessageItem = ({ message, isMe }) => {
    const { text, time, senderAvatar, type, fileUrl, fileName, fileSize } = message;

    const renderAttachment = () => {
        if (!fileUrl) return null;

        // Image attachment
        if (type === "IMAGE") {
            return (
                <div className="attachment-image">
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                        <img src={fileUrl} alt={fileName || "Ảnh"} loading="lazy" />
                    </a>
                    {text && <p className="image-caption">{text}</p>}
                </div>
            );
        }

        // File attachment (documents, etc.)
        if (type === "FILE") {
            const ext = getFileExtension(fileName);
            return (
                <div className="attachment-file">
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" download={fileName}>
                        <div className="file-icon-wrapper">
                            <FileText size={28} />
                            {ext && <span className="file-extension">{ext}</span>}
                        </div>
                        <div className="file-info">
                            <span className="file-name">{fileName}</span>
                            {fileSize && <span className="file-size">{formatFileSize(fileSize)}</span>}
                        </div>
                        <Download size={18} className="download-icon" />
                    </a>
                </div>
            );
        }

        return null;
    };

    return (
        <div className={`message-item-wrapper ${isMe ? 'me' : 'them'}`}>
            {!isMe && (
                <div className="message-avatar">
                    <img src={senderAvatar} alt="avatar" />
                </div>
            )}
            
            <div className="message-content">
                <div className="bubble">
                    {renderAttachment()}
                    {/* Show text for TEXT/FILE messages only (IMAGE captions are inside renderAttachment) */}
                    {text && type !== "IMAGE" && <p>{text}</p>}
                </div>
                <span className="message-time">{time}</span>
            </div>
        </div>
    );
};

export default MessageItem;
