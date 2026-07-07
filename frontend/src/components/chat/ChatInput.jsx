import React, { useState, useRef, useCallback, useEffect } from "react";
import { Smile, Send, Paperclip, Image, Loader2, X, Film, Search } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

const GIPHY_API_KEY = process.env.REACT_APP_GIPHY_API_KEY;
const GIPHY_BASE = "https://api.giphy.com/v1/gifs";

const ChatInput = ({ onSend, onSendFile, onSendGif }) => {
    const [text, setText] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [gifSearch, setGifSearch] = useState("");
    const [gifs, setGifs] = useState([]);
    const [loadingGifs, setLoadingGifs] = useState(false);
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);
    const inputRef = useRef(null);
    const emojiRef = useRef(null);
    const gifRef = useRef(null);

    // ─── Click outside to close pickers ─────────────────────────────────
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (emojiRef.current && !emojiRef.current.contains(e.target)) {
                setShowEmojiPicker(false);
            }
            if (gifRef.current && !gifRef.current.contains(e.target)) {
                setShowGifPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ─── Submit text message ────────────────────────────────────────────
    const handleSubmit = (e) => {
        e.preventDefault();
        if (text.trim()) {
            onSend(text);
            setText("");
        }
    };

    // ─── Emoji handling ────────────────────────────────────────────────
    const onEmojiClick = (emojiData) => {
        setText(prev => prev + emojiData.emoji);
        inputRef.current?.focus();
    };

    const toggleEmojiPicker = () => {
        setShowEmojiPicker(prev => !prev);
        setShowGifPicker(false);
    };

    // ─── GIF handling ──────────────────────────────────────────────────
    const fetchGifs = useCallback(async (query = "") => {
        if (!GIPHY_API_KEY) return;
        setLoadingGifs(true);
        try {
            const endpoint = query
                ? `${GIPHY_BASE}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=25&rating=g`
                : `${GIPHY_BASE}/trending?api_key=${GIPHY_API_KEY}&limit=25&rating=g`;
            const res = await fetch(endpoint);
            const data = await res.json();
            setGifs(data.data || []);
        } catch (err) {
            console.error("Failed to fetch GIFs:", err);
        } finally {
            setLoadingGifs(false);
        }
    }, []);

    const toggleGifPicker = () => {
        const willShow = !showGifPicker;
        setShowGifPicker(willShow);
        setShowEmojiPicker(false);
        if (willShow) {
            setGifSearch("");
            fetchGifs();
        }
    };

    const handleGifSearch = (e) => {
        e.preventDefault();
        fetchGifs(gifSearch);
    };

    const handleGifSelect = (gif) => {
        const gifUrl = gif.images?.original?.url || gif.images?.fixed_height?.url;
        if (gifUrl && onSendGif) {
            onSendGif(gifUrl, gif.title || "GIF");
        }
        setShowGifPicker(false);
    };

    // ─── File handling ──────────────────────────────────────────────────
    const MAX_FILE_SIZE = 20 * 1024 * 1024;

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > MAX_FILE_SIZE) {
            alert("File quá lớn. Vui lòng chọn file dưới 20MB.");
            e.target.value = "";
            return;
        }
        setSelectedFile(file);
        e.target.value = "";
    };

    const handleUploadFile = async (file) => {
        if (!file || !onSendFile) return;
        setUploading(true);
        setUploadProgress(0);
        try {
            await onSendFile(file, (progress) => setUploadProgress(progress));
            setSelectedFile(null);
        } catch (err) {
            console.error("Upload failed:", err);
            alert("Tải file lên thất bại. Vui lòng thử lại.");
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    useEffect(() => {
        if (selectedFile) handleUploadFile(selectedFile);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFile]);

    const handlePaperclipClick = () => fileInputRef.current?.click();
    const handleImageClick = () => imageInputRef.current?.click();

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
            <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileSelect} disabled={uploading} />
            <input ref={imageInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileSelect} disabled={uploading} />

            <div className="input-actions-left">
                <button className="icon-btn" title="Đính kèm tài liệu" onClick={handlePaperclipClick} disabled={uploading}>
                    <Paperclip size={20} />
                </button>
                <button className="icon-btn" title="Gửi ảnh" onClick={handleImageClick} disabled={uploading}>
                    <Image size={20} />
                </button>
            </div>

            <form className="input-form" onSubmit={handleSubmit}>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Nhập tin nhắn..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={uploading}
                />

                {/* Emoji picker area */}
                <div className="picker-wrapper" ref={emojiRef}>
                    <button className="emoji-btn" type="button" onClick={toggleEmojiPicker} title="Chọn emoji">
                        <Smile size={20} />
                    </button>
                    {showEmojiPicker && (
                        <div className="emoji-picker-dropdown">
                            <EmojiPicker onEmojiClick={onEmojiClick} skinTonesDisabled searchDisabled={false} width={300} height={380} />
                        </div>
                    )}
                </div>

                {/* GIF picker area */}
                <div className="picker-wrapper" ref={gifRef}>                            <button className="gif-btn" type="button" onClick={toggleGifPicker} title="Chọn GIF">
                                <Film size={20} />
                            </button>
                    {showGifPicker && (
                        <div className="gif-picker-dropdown">
                            <form className="gif-search-bar" onSubmit={handleGifSearch}>
                                <Search size={16} />
                                <input
                                    type="text"
                                    placeholder="Tìm GIF..."
                                    value={gifSearch}
                                    onChange={(e) => setGifSearch(e.target.value)}
                                />
                            </form>
                            <div className="gif-grid">
                                {loadingGifs ? (
                                    <div className="gif-loading"><Loader2 size={24} className="spin" /></div>
                                ) : gifs.length > 0 ? (
                                    gifs.map(gif => (
                                        <button
                                            key={gif.id}
                                            className="gif-item"
                                            onClick={() => handleGifSelect(gif)}
                                            type="button"
                                        >
                                            <img
                                                src={gif.images?.fixed_height_small?.url || gif.images?.fixed_height?.url}
                                                alt={gif.title || "GIF"}
                                                loading="lazy"
                                            />
                                        </button>
                                    ))
                                ) : !GIPHY_API_KEY ? (
                                    <p className="gif-empty">Chưa cấu hình GIPHY API</p>
                                ) : (
                                    <p className="gif-empty">Không tìm thấy GIF</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

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

