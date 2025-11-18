import sys
from typing import Optional, Any, List, Dict

from PyQt5.QtWidgets import (
    QApplication,
    QWidget,
    QVBoxLayout,
    QTextEdit,
    QLineEdit,
    QPushButton,
    QLabel,
    QHBoxLayout,
)
from PyQt5.QtCore import QThread, pyqtSignal

from transformers import pipeline


# --- KONFIGURACJA MODELU -------------------------------------------------

MODEL_NAME = "gpt2"        # łatwo podmienisz np. na "gpt2-medium"
MAX_EXTRA_TOKENS = 50      # ile tokenów ponad długość promptu
MAX_TOTAL_LENGTH = 256     # twardy limit długości generacji (prompt + output)


# --- WĄTEK ŁADOWANIA MODELU ----------------------------------------------

class ModelLoaderThread(QThread):
    """
    Wątek do ładowania modelu w tle, żeby nie blokować GUI.
    """
    loaded = pyqtSignal(object)   # emituje załadowany pipeline/generator
    error = pyqtSignal(str)       # emituje tekst błędu

    def run(self) -> None:
        try:
            generator = pipeline(
                "text-generation",
                model=MODEL_NAME,
                # device=-1  # możesz odkomentować, żeby wymusić CPU
            )
            self.loaded.emit(generator)
        except Exception as e:
            self.error.emit(str(e))


# --- WĄTEK GENEROWANIA ODPOWIEDZI ----------------------------------------

class GenerationThread(QThread):
    """
    Wątek generujący odpowiedź – UI pozostaje responsywne.
    """
    generated = pyqtSignal(str)
    error = pyqtSignal(str)

    def __init__(self, prompt: str, generator: Any, parent: Optional[QThread] = None) -> None:
        super().__init__(parent)
        self.prompt = prompt
        self.generator = generator

    def run(self) -> None:
        try:
            # prosty heurystyczny limit długości
            prompt_words = self.prompt.split()
            max_length = len(prompt_words) + MAX_EXTRA_TOKENS
            max_length = min(max_length, MAX_TOTAL_LENGTH)

            responses: List[Dict[str, str]] = self.generator(
                self.prompt,
                max_length=max_length,
                num_return_sequences=1,
                do_sample=True,
                top_p=0.95,
                top_k=50,
                temperature=0.8,
            )

            full_text: str = responses[0]["generated_text"]

            # Spróbuj usunąć prompt z przodu — defensywnie
            if full_text.startswith(self.prompt):
                response_raw = full_text[len(self.prompt):]
            else:
                response_raw = full_text

            response = response_raw.strip()

            # Bierz tylko pierwszą linię, żeby nie lało ściany tekstu
            if "\n" in response:
                response = response.split("\n", 1)[0].strip()

            if not response:
                response = "I don't know what to say."

            self.generated.emit(response)

        except Exception as e:
            self.error.emit(str(e))


# --- GŁÓWNE OKNO CZATU ---------------------------------------------------

class ChatGPTClone(QWidget):
    """
    Prosty widżet czatu oparty o lokalny model HuggingFace (gpt2).

    Może działać jako:
    - samodzielne okno (standalone),
    - lub widget osadzony w większym QMainWindow / layoutcie.
    """

    def __init__(self, parent: Optional[QWidget] = None) -> None:
        super().__init__(parent)

        self.setWindowTitle("ChatGPT Clone")
        self.resize(600, 400)

        self.conversation: str = ""          # prosty log tekstowy rozmowy
        self.generator: Optional[Any] = None # ustawiany po załadowaniu modelu

        self._loader_thread: Optional[ModelLoaderThread] = None
        self._gen_thread: Optional[GenerationThread] = None

        self._init_ui()
        self._load_model()

    # --- UI --------------------------------------------------------------

    def _init_ui(self) -> None:
        layout = QVBoxLayout(self)

        # Pole rozmowy
        self.chat_display = QTextEdit()
        self.chat_display.setReadOnly(True)
        layout.addWidget(self.chat_display)

        # Input + przycisk "Send"
        input_layout = QHBoxLayout()

        self.input_field = QLineEdit()
        self.input_field.setPlaceholderText("Type your message and press Enter...")
        self.input_field.returnPressed.connect(self._on_send_clicked)

        self.send_button = QPushButton("Send")
        self.send_button.setEnabled(False)  # włączymy po załadowaniu modelu
        self.send_button.clicked.connect(self._on_send_clicked)

        input_layout.addWidget(self.input_field)
        input_layout.addWidget(self.send_button)

        layout.addLayout(input_layout)

        # Status (ładowanie / błędy / gotowość)
        self.status_label = QLabel("Loading model...")
        layout.addWidget(self.status_label)

        self.setLayout(layout)

    # --- LOGOWANIE ROZMOWY ----------------------------------------------

    def _append_message(self, sender: str, text: str) -> None:
        """
        Dodaj wiadomość do konwersacji i odśwież widok.
        """
        self.conversation += f"{sender}: {text}\n"
        self.chat_display.setPlainText(self.conversation)
        self.chat_display.verticalScrollBar().setValue(
            self.chat_display.verticalScrollBar().maximum()
        )

    # --- ŁADOWANIE MODELU -----------------------------------------------

    def _load_model(self) -> None:
        """
        Startuje wątek ładujący model.
        """
        self._loader_thread = ModelLoaderThread()
        self._loader_thread.loaded.connect(self._on_model_loaded)
        self._loader_thread.error.connect(self._on_model_error)
        self._loader_thread.start()

    def _on_model_loaded(self, generator: Any) -> None:
        self.generator = generator
        self.status_label.setText("Model loaded. You can start chatting.")
        self.send_button.setEnabled(True)

    def _on_model_error(self, message: str) -> None:
        self.status_label.setText(f"Error loading model: {message}")
        self.send_button.setEnabled(False)

    # --- WYSYŁANIE WIADOMOŚCI -------------------------------------------

    def _on_send_clicked(self) -> None:
        """
        Obsługa kliknięcia przycisku / Enter w polu tekstowym.
        """
        if self.generator is None:
            self.status_label.setText("Model not ready yet...")
            return

        user_text = self.input_field.text().strip()
        if not user_text:
            return

        self._append_message("You", user_text)
        self.input_field.clear()

        # Zablokuj podczas generowania, żeby nie odpalać wielu wątków naraz
        self.send_button.setEnabled(False)
        self.status_label.setText("Generating response...")

        # Możesz tu zmienić strategię promptu, np. tylko ostatnie N linii
        prompt = self.conversation + "Bot:"

        self._gen_thread = GenerationThread(prompt, self.generator)
        self._gen_thread.generated.connect(self._on_generation_finished)
        self._gen_thread.error.connect(self._on_generation_error)
        self._gen_thread.start()

    # --- OBSŁUGA WYNIKU GENERACJI ---------------------------------------

    def _on_generation_finished(self, response: str) -> None:
        self._append_message("Bot", response)
        self.status_label.setText("Ready.")
        self.send_button.setEnabled(True)

    def _on_generation_error(self, message: str) -> None:
        self._append_message("Bot", f"[Error generating response: {message}]")
        self.status_label.setText("Error during generation.")
        self.send_button.setEnabled(True)


# --- ENTRYPOINT ----------------------------------------------------------

def main() -> None:
    app = QApplication(sys.argv)
    window = ChatGPTClone()
    window.show()
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
