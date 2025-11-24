import React, { useEffect } from "react";

export default function CommentPopup({ task, onClose }) {
  // 1. Debugging: Check the console to see what the 'task' object looks like
  console.log("Popup received task data:", task);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Prevent closing when clicking inside the card
  const handleCardClick = (e) => e.stopPropagation();

  // 2. LOGIC FIX: Handle both String (comment) and Array (comments)
  let displayContent = "";
  
  if (task.comments && typeof task.comments === 'string') {
    // Case A: It's a simple string field named 'comment'
    displayContent = task.comments;
  } else if (Array.isArray(task.comments) && task.comments.length > 0) {
    // Case B: It's an array named 'comments' (Join them or pick the last one)
    // Assuming array of strings, or array of objects with a 'text' property
    displayContent = task.comments.map(c => (typeof c === 'object' ? c.text : c)).join('\n\n');
  } else if (task.description) {
     // Optional: Fallback to description if you want
     // displayContent = task.description; 
  }

  const hasContent = displayContent && displayContent.trim().length > 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        onClick={handleCardClick}
        className="bg-white w-full max-w-md rounded-xl shadow-2xl transform transition-all animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Operator Comment</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]" title={task.title}>
              Re: {task.title}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {hasContent ? (
            <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
              {/* 3. Render the calculated content */}
              {displayContent}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-gray-400">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
               </svg>
               <span className="text-sm">No comments found for this task.</span>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-end">
           <button 
             onClick={onClose} 
             className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg shadow-sm transition-all"
           >
             Close
           </button>
        </div>
      </div>
    </div>
  );
}