import React, { useState, useRef } from "react";
import { Smile, Send, Paperclip, Image, Loader2, X } from "lucide-react";

const ChatInput = ({ onSend, onSendFile }) => {
    const [text, setText] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (text.trim()) {
            onSend(text);
            setText("");
        }
    };

    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            alert("File quá lớn. Vui lòng chọn file dưới 20MB.");
            e.target.value = "";
            return;
        }

        setSelectedFile(file);
        // Reset input so the same file can be selected again
        e.target.value = "";
    };

    const handleUploadFile = async (file) => {
        if (!file || !onSendFile) return;

        setUploading(true);
        setUploadProgress(0);

        try {
            await onSendFile(file, (progress) => {
                setUploadProgress(progress);
            });
            setSelectedFile(null);
        } catch (err) {
            console.error("Upload failed:", err);
            alert("Tải file lên thất bại. Vui lòng thử lại.");
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    // Auto-upload when a file is selected
    React.useEffect(() => {
        if (selectedFile) {
            handleUploadFile(selectedFile);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFile]);

    const handlePaperclipClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageClick = () => {
        imageInputRef.current?.click();
    };

    const cancelUpload = () => {
        setSelectedFile(null);
        setUploading(false);
        setUploadProgress(0);
    };

    return (
        <div className="chat-input-container">
            {/* Upload progress bar */}
            {uploading && (
                <div className="upload-progress-bar">
                    <div className="upload-progress-info">
                        <Loader2 size={16} className="spin" />
                        <span>Đang tải lên... {uploadProgress}%</span>
                        <button className="icon-btn cancel-upload" onClick={cancelUpload}>
                            <X size={16} />
                        </button>
                    </div>
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                    </div>
                </div>
            )}

            {/* Hidden file inputs */}
            <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                onChange={handleFileSelect}
                disabled={uploading}
            />
            <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileSelect}
                disabled={uploading}
            />

            <div className="input-actions-left">
                <button
                    className="icon-btn"
                    title="Đính kèm tài liệu"
                    onClick={handlePaperclipClick}
                    disabled={uploading}
                >
                    <Paperclip size={20} />
                </button>
                <button
                    className="icon-btn"
                    title="Gửi ảnh"
                    onClick={handleImageClick}
                    disabled={uploading}
                >
                    <Image size={20} />
                </button>
            </div>

            <form className="input-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Nhập tin nhắn..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={uploading}
                />
                <button className="emoji-btn" type="button"><Smile size={20} /></button>
                <button
                    type="submit"
                    className={`send-btn ${text.trim() ? 'active' : ''}`}
                    disabled={!text.trim() || uploading}
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default ChatInput;
