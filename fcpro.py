import cv2
import tkinter as tk
from tkinter import filedialog
from PIL import Image, ImageTk
import numpy as np

class VideoComparator:
    def __init__(self, root):
        self.root = root
        self.root.title("Disc Golf Form Analyzer")
        
        self.canvas_width = 640
        self.canvas_height = 360
        
        self.video_paths = [None, None]
        self.caps = [None, None]
        self.frames = [None, None]
        self.playing = [False, False]
        self.slow_motion_factor = 1  # 1x speed by default
        self.drawing = False
        self.drawings = [[], []]  # Store drawn shapes for each video
        
        self.create_widgets()
    
    def create_widgets(self):
        # Video selection buttons
        tk.Button(self.root, text="Load Video 1", command=lambda: self.load_video(0)).pack()
        tk.Button(self.root, text="Load Video 2", command=lambda: self.load_video(1)).pack()
        
        # Canvas for videos
        self.canvases = [
            tk.Canvas(self.root, width=self.canvas_width, height=self.canvas_height, bg='black')
            for _ in range(2)
        ]
        for canvas in self.canvases:
            canvas.pack(side=tk.LEFT)
        
        # Controls
        control_frame = tk.Frame(self.root)
        control_frame.pack()
        tk.Button(control_frame, text="Play/Pause", command=self.toggle_play).pack(side=tk.LEFT)
        tk.Button(control_frame, text="Step Forward", command=lambda: self.step_frame(1)).pack(side=tk.LEFT)
        tk.Button(control_frame, text="Step Backward", command=lambda: self.step_frame(-1)).pack(side=tk.LEFT)
        tk.Button(control_frame, text="Slow Motion", command=self.toggle_slow_motion).pack(side=tk.LEFT)
        tk.Button(control_frame, text="Draw Mode", command=self.toggle_drawing).pack(side=tk.LEFT)
        
        self.update()
    
    def load_video(self, index):
        path = filedialog.askopenfilename(filetypes=[("Video Files", "*.mp4;*.avi;*.mov")])
        if path:
            self.video_paths[index] = path
            self.caps[index] = cv2.VideoCapture(path)
    
    def toggle_play(self):
        self.playing = [not p for p in self.playing]
    
    def step_frame(self, step):
        for i in range(2):
            if self.caps[i]:
                current_frame = int(self.caps[i].get(cv2.CAP_PROP_POS_FRAMES))
                self.caps[i].set(cv2.CAP_PROP_POS_FRAMES, max(0, current_frame + step))
                self.read_frame(i)
    
    def toggle_slow_motion(self):
        self.slow_motion_factor = 2 if self.slow_motion_factor == 1 else 1
    
    def toggle_drawing(self):
        self.drawing = not self.drawing
    
    def read_frame(self, index):
        if self.caps[index]:
            ret, frame = self.caps[index].read()
            if ret:
                frame = cv2.resize(frame, (self.canvas_width, self.canvas_height))
                frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                self.frames[index] = ImageTk.PhotoImage(Image.fromarray(frame))
                self.canvases[index].create_image(0, 0, anchor=tk.NW, image=self.frames[index])
    
    def update(self):
        for i in range(2):
            if self.playing[i] and self.caps[i]:
                self.read_frame(i)
        self.root.after(30 * self.slow_motion_factor, self.update)

if __name__ == "__main__":
    root = tk.Tk()
    app = VideoComparator(root)
    root.mainloop()
