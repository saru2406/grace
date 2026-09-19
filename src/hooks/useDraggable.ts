import { useEffect, RefObject } from 'react';

export function useDraggable(dialogRef: RefObject<HTMLElement>, handleSelector: string, isOpen: boolean = true) {
  useEffect(() => {
    if (!isOpen) return;

    const dialog = dialogRef.current;
    if (!dialog) return;
    
    // Select the drag handle inside the dialog
    const handle = dialog.querySelector(handleSelector) as HTMLElement;
    if (!handle) return;
    
    let isDragging = false;
    let startX = 0, startY = 0;
    let translateX = 0, translateY = 0;
    
    const onMouseDown = (e: MouseEvent) => {
      // Ignore clicks on buttons/inputs within the handle area just in case
      if ((e.target as HTMLElement).closest('button, input')) return;
      
      isDragging = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      
      // Prevent text selection while dragging
      e.preventDefault();
    };
    
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      dialog.style.transform = `translate(${translateX}px, ${translateY}px)`;
    };
    
    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    handle.addEventListener('mousedown', onMouseDown);
    // Change cursor style to indicate draggability
    handle.style.cursor = 'grab';
    const grabCursor = () => { handle.style.cursor = 'grabbing'; };
    const defaultCursor = () => { handle.style.cursor = 'grab'; };
    
    handle.addEventListener('mousedown', grabCursor);
    handle.addEventListener('mouseup', defaultCursor);
    
    return () => {
      handle.removeEventListener('mousedown', onMouseDown);
      handle.removeEventListener('mousedown', grabCursor);
      handle.removeEventListener('mouseup', defaultCursor);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [dialogRef, handleSelector, isOpen]);
}
