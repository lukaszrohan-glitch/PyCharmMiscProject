import sys
from PyQt5.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QTextEdit, QLineEdit,
    QPushButton, QLabel, QHBoxLayout
)
from PyQt5.QtCore import QThread, pyqtSignal
from transformers import pipeline


# Thread for loading the model in the background
class ModelLoaderThread(QThread):
    loaded = pyqtSignal(object)
    error = pyqtSignal(str)

    def run(self):
        try:
            generator = pipeline('text-generation', model='gpt2')
            self.loaded.emit(generator)
        except Exception as e:
            self.error.emit(str(e))


# Thread for generating responses without freezing the UI
class GenerationThread(QThread):
    generated = pyqtSignal(str)
    error = pyqtSignal(str)

    def __init__(self, prompt, generator, parent=None):
        super().__init__(parent)
        self.prompt = prompt
        self.generator = generator

    def run(self):
        try:
            prompt_words = self.prompt.split()
            max_length = len(prompt_words) + 50  # Adjust response length as needed
            responses = self.generator(self.prompt, max_length=max_length, num_return_sequences=1)
            full_text = responses[0]['generated_text']
            # Remove the prompt part from the generated text
            response = full_text[len(self.prompt):].strip().split("\n")[0]
            if not response:
                response = "I don't know what to say."
            self.generated.emit(response)
        except Exception as e:
            self.error.emit(str(e))


class ChatGPTClone(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("ChatGPT Clone")
        self.resize(600, 400)
        self.conversation = ""
        self.generator = None  # Will be set after loading the model
        self.init_ui()
        self.load_model()  # Load the model in the background

    def init_ui(self):
        layout = QVBoxLayout()

        # Conversation display
        self.chat_display = QTextEdit()
        self.chat_
