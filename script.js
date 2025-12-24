// Portfolio Studio - macOS Style Portfolio
// =========================================

class MacOSPortfolio {
    constructor() {
        this.bootScreen = document.getElementById('boot-screen');
        this.desktop = document.getElementById('desktop');
        this.windowsContainer = document.getElementById('windows-container');
        this.windowTemplate = document.getElementById('window-template');
        
        this.windows = new Map();
        this.windowIdCounter = 0;
        this.highestZIndex = 100;
        this.activeWindow = null;
        
        // Window positions offset for cascading
        this.windowOffset = { x: 50, y: 50 };
        this.currentOffset = { x: 100, y: 80 };
        
        this.init();
    }
    
    init() {
        this.startBootSequence();
        this.setupEventListeners();
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }
    
    // Boot Sequence
    startBootSequence() {
        setTimeout(() => {
            this.bootScreen.classList.add('fade-out');
            setTimeout(() => {
                this.bootScreen.classList.add('hidden');
                this.desktop.classList.remove('hidden');
            }, 800);
        }, 3000);
    }
    
    // Clock
    updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('he-IL', {
            hour: '2-digit',
            minute: '2-digit',
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
        document.getElementById('current-time').textContent = timeString;
    }
    
    // Event Listeners
    setupEventListeners() {
        // Desktop icons - double click
        document.querySelectorAll('.desktop-icon').forEach(icon => {
            icon.addEventListener('dblclick', (e) => {
                const project = icon.dataset.project;
                const title = icon.dataset.title;
                this.openWindow(project, title);
            });
            
            // Single click to select
            icon.addEventListener('click', (e) => {
                document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
                icon.classList.add('selected');
            });
        });
        
        // Dock items - single click
        document.querySelectorAll('.dock-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const project = item.dataset.project;
                const title = item.dataset.title;
                this.openWindow(project, title);
            });
        });
        
        // Click on desktop to deselect icons
        this.desktop.addEventListener('click', (e) => {
            if (e.target === this.desktop || e.target.classList.contains('desktop-icons')) {
                document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
            }
        });
    }
    
    // Window Management
    openWindow(project, title) {
        // Check if window already exists
        for (const [id, win] of this.windows) {
            if (win.project === project) {
                this.focusWindow(id);
                // Restore if minimized
                const windowEl = document.getElementById(`window-${id}`);
                if (windowEl.classList.contains('minimized')) {
                    windowEl.classList.remove('minimized');
                    windowEl.style.display = 'flex';
                }
                return;
            }
        }
        
        // Create new window
        const windowId = ++this.windowIdCounter;
        const template = this.windowTemplate.content.cloneNode(true);
        const windowEl = template.querySelector('.window');
        
        windowEl.id = `window-${windowId}`;
        windowEl.style.width = '800px';
        windowEl.style.height = '600px';
        windowEl.style.left = `${this.currentOffset.x}px`;
        windowEl.style.top = `${this.currentOffset.y}px`;
        windowEl.style.zIndex = ++this.highestZIndex;
        
        // Update cascade offset
        this.currentOffset.x += this.windowOffset.x;
        this.currentOffset.y += this.windowOffset.y;
        
        // Reset offset if too far
        if (this.currentOffset.x > 400) this.currentOffset.x = 100;
        if (this.currentOffset.y > 300) this.currentOffset.y = 80;
        
        // Set content
        windowEl.querySelector('.window-title').textContent = title;
        windowEl.querySelector('.address-text').textContent = `portfolio.studio/${project}`;
        
        const img = windowEl.querySelector('.window-image');
        img.src = `avodot/${project}.png`;
        img.alt = title;
        
        // Add event listeners
        this.setupWindowEvents(windowEl, windowId);
        
        // Add to DOM
        this.windowsContainer.appendChild(windowEl);
        
        // Store window data
        this.windows.set(windowId, {
            element: windowEl,
            project: project,
            title: title,
            isMaximized: false,
            prevState: null
        });
        
        this.focusWindow(windowId);
    }
    
    setupWindowEvents(windowEl, windowId) {
        const titlebar = windowEl.querySelector('.window-titlebar');
        const closeBtn = windowEl.querySelector('.window-btn.close');
        const minimizeBtn = windowEl.querySelector('.window-btn.minimize');
        const maximizeBtn = windowEl.querySelector('.window-btn.maximize');
        const resizeHandle = windowEl.querySelector('.window-resize-handle');
        
        // Focus on click
        windowEl.addEventListener('mousedown', () => this.focusWindow(windowId));
        
        // Close button
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeWindow(windowId);
        });
        
        // Minimize button
        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.minimizeWindow(windowId);
        });
        
        // Maximize button
        maximizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMaximize(windowId);
        });
        
        // Dragging
        this.setupDrag(windowEl, titlebar, windowId);
        
        // Resizing
        this.setupResize(windowEl, resizeHandle, windowId);
    }
    
    setupDrag(windowEl, handle, windowId) {
        let isDragging = false;
        let startX, startY;
        let startLeft, startTop;
        
        handle.addEventListener('mousedown', (e) => {
            // Don't drag if clicking buttons
            if (e.target.classList.contains('window-btn')) return;
            
            const win = this.windows.get(windowId);
            if (win.isMaximized) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = windowEl.offsetLeft;
            startTop = windowEl.offsetTop;
            
            windowEl.style.transition = 'none';
            document.body.style.cursor = 'grabbing';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newLeft = startLeft + deltaX;
            let newTop = startTop + deltaY;
            
            // Keep window within bounds
            newTop = Math.max(28, newTop); // Menu bar height
            
            windowEl.style.left = `${newLeft}px`;
            windowEl.style.top = `${newTop}px`;
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                windowEl.style.transition = '';
                document.body.style.cursor = '';
            }
        });
    }
    
    setupResize(windowEl, handle, windowId) {
        let isResizing = false;
        let startX, startY;
        let startWidth, startHeight;
        
        handle.addEventListener('mousedown', (e) => {
            const win = this.windows.get(windowId);
            if (win.isMaximized) return;
            
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = windowEl.offsetWidth;
            startHeight = windowEl.offsetHeight;
            
            windowEl.style.transition = 'none';
            document.body.style.cursor = 'nwse-resize';
            e.stopPropagation();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const newWidth = Math.max(400, startWidth + deltaX);
            const newHeight = Math.max(300, startHeight + deltaY);
            
            windowEl.style.width = `${newWidth}px`;
            windowEl.style.height = `${newHeight}px`;
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                windowEl.style.transition = '';
                document.body.style.cursor = '';
            }
        });
    }
    
    focusWindow(windowId) {
        // Remove active class from all windows
        this.windows.forEach((win, id) => {
            win.element.classList.add('inactive');
        });
        
        // Set this window as active
        const win = this.windows.get(windowId);
        if (win) {
            win.element.classList.remove('inactive');
            win.element.style.zIndex = ++this.highestZIndex;
            this.activeWindow = windowId;
        }
    }
    
    closeWindow(windowId) {
        const win = this.windows.get(windowId);
        if (!win) return;
        
        win.element.classList.add('closing');
        
        setTimeout(() => {
            win.element.remove();
            this.windows.delete(windowId);
        }, 200);
    }
    
    minimizeWindow(windowId) {
        const win = this.windows.get(windowId);
        if (!win) return;
        
        win.element.classList.add('minimizing');
        
        setTimeout(() => {
            win.element.style.display = 'none';
            win.element.classList.remove('minimizing');
            win.element.classList.add('minimized');
        }, 400);
    }
    
    toggleMaximize(windowId) {
        const win = this.windows.get(windowId);
        if (!win) return;
        
        win.element.classList.add('maximizing');
        
        if (win.isMaximized) {
            // Restore
            win.element.style.left = win.prevState.left;
            win.element.style.top = win.prevState.top;
            win.element.style.width = win.prevState.width;
            win.element.style.height = win.prevState.height;
            win.isMaximized = false;
        } else {
            // Save current state
            win.prevState = {
                left: win.element.style.left,
                top: win.element.style.top,
                width: win.element.style.width,
                height: win.element.style.height
            };
            
            // Maximize
            win.element.style.left = '0';
            win.element.style.top = '28px'; // Menu bar height
            win.element.style.width = '100vw';
            win.element.style.height = `calc(100vh - 28px - 86px)`; // Menu + Dock
            win.isMaximized = true;
        }
        
        setTimeout(() => {
            win.element.classList.remove('maximizing');
        }, 300);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new MacOSPortfolio();
});

