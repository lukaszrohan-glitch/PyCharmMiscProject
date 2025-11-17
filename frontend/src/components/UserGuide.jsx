import React from 'react'
import { useI18n } from '../i18n.jsx'

export default function UserGuide() {
  const { t, lang } = useI18n()

  const content = {
    pl: {
      title: 'Przewodnik Użytkownika',
      intro: 'Witamy w Arkuszownia SMB - kompleksowym systemie zarządzania produkcją. Ten przewodnik pomoże Ci w pełni wykorzystać możliwości aplikacji.',
      sections: [
        {
          title: '📋 Zarządzanie Zamówieniami',
          items: [
            {
              subtitle: 'Przeglądanie zamówień',
              text: 'Na stronie głównej zobaczysz listę wszystkich zamówień. Każde zamówienie zawiera informacje o ID, kliencie, statusie i terminie realizacji.'
            },
            {
              subtitle: 'Tworzenie nowego zamówienia',
              steps: [
                'Kliknij przycisk "Utwórz zamówienie" w sekcji formularza',
                'Wypełnij wymagane pola: ID zamówienia i ID klienta',
                'Wybierz status zamówienia (Nowe, Planowane, W produkcji, Zakończone, Zafakturowane)',
                'Opcjonalnie ustaw termin realizacji',
                'Kliknij "Dodaj zamówienie"'
              ]
            },
            {
              subtitle: 'Statusy zamówień',
              list: [
                'Nowe - Zamówienie zostało utworzone',
                'Planowane - Zamówienie jest w fazie planowania',
                'W produkcji - Zamówienie jest realizowane',
                'Zakończone - Produkcja została zakończona',
                'Zafakturowane - Zamówienie zostało zafakturowane'
              ]
            }
          ]
        },
        {
          title: '💰 Panel Finansowy',
          items: [
            {
              subtitle: 'Przegląd finansów zamówienia',
              text: 'Po wybraniu zamówienia z listy, panel po prawej stronie wyświetli szczegóły finansowe.'
            },
            {
              list: [
                'Przychód - Całkowity przychód z zamówienia',
                'Koszt materiałów - Koszty surowców i materiałów',
                'Koszt pracy - Koszty robocizny',
                'Marża brutto - Zysk brutto (Przychód - Koszty)'
              ]
            }
          ]
        },
        {
          title: '📦 Zarządzanie Zapasami',
          items: [
            {
              subtitle: 'Rejestrowanie ruchu magazynowego',
              steps: [
                'W sekcji "Magazyn" wypełnij formularz',
                'Podaj ID transakcji (unikalny identyfikator)',
                'Wybierz produkt z listy rozwijanej',
                'Wprowadź zmianę ilości (dodatnia dla przyjęcia, ujemna dla wydania)',
                'Wybierz powód: PO (Zamówienie zakupu), WO (Zlecenie produkcji), Sale (Sprzedaż), Adjust (Korekta)',
                'Kliknij "Dodaj ruch magazynowy"'
              ]
            }
          ]
        },
        {
          title: '⏱️ Ewidencja Czasu Pracy',
          items: [
            {
              subtitle: 'Rejestrowanie czasu pracy',
              steps: [
                'W sekcji "Timesheet" wypełnij formularz',
                'Wprowadź ID pracownika',
                'Podaj ID zamówienia, do którego odnosi się praca',
                'Wprowadź liczbę przepracowanych godzin',
                'Opcjonalnie dodaj notatki',
                'Kliknij "Dodaj timesheet"'
              ]
            }
          ]
        },
        {
          title: '📝 Linie Zamówienia',
          items: [
            {
              subtitle: 'Dodawanie pozycji do zamówienia',
              steps: [
                'Użyj sekcji "Dodaj linię zamówienia"',
                'Wybierz zamówienie z listy',
                'Wybierz produkt',
                'Podaj ilość',
                'Wprowadź cenę jednostkową',
                'Opcjonalnie ustaw rabat (0-90%)',
                'Kliknij "Dodaj linię"'
              ]
            }
          ]
        },
        {
          title: '🔐 System Uprawnień',
          items: [
            {
              subtitle: 'Poziomy dostępu',
              list: [
                'Bez klucza API - Dostęp tylko do odczytu (przeglądanie danych)',
                'Z kluczem API - Pełny dostęp do tworzenia i modyfikacji danych',
                'Z kluczem Admin - Zarządzanie kluczami API i użytkownikami'
              ]
            },
            {
              subtitle: 'Jak uzyskać klucz API?',
              text: 'Skontaktuj się z administratorem systemu, który utworzy dla Ciebie unikalny klucz API.'
            }
          ]
        },
        {
          title: '🛠️ Panel Administracyjny',
          items: [
            {
              subtitle: 'Zarządzanie kluczami API (tylko admin)',
              steps: [
                'Kliknij "Admin" w górnym menu',
                'Wprowadź klucz administratora',
                'Zobacz listę wszystkich aktywnych kluczy API',
                'Utwórz nowy klucz podając etykietę (np. nazwę użytkownika)',
                'Skopiuj wygenerowany klucz i przekaż użytkownikowi',
                'Usuń nieużywane klucze klikając "Usuń"',
                'Użyj "Rotuj klucz" aby wygenerować nowy klucz dla istniejącego użytkownika'
              ]
            }
          ]
        },
        {
          title: '💡 Wskazówki i Najlepsze Praktyki',
          items: [
            {
              list: [
                'Regularnie aktualizuj statusy zamówień',
                'Rejestruj czas pracy na bieżąco',
                'Używaj opisowych ID zamówień i produktów',
                'Sprawdzaj panel finansowy przed zakończeniem zamówienia',
                'Przechowuj klucz API w bezpiecznym miejscu',
                'Nie udostępniaj swojego klucza API innym osobom',
                'Zgłaszaj problemy lub pytania do administratora'
              ]
            }
          ]
        },
        {
          title: '❓ Często Zadawane Pytania',
          items: [
            {
              subtitle: 'P: Czy mogę edytować istniejące zamówienie?',
              text: 'O: Obecnie system nie obsługuje bezpośredniej edycji. Możesz utworzyć nowe zamówienie z poprawnymi danymi.'
            },
            {
              subtitle: 'P: Jak usunąć błędnie wprowadzony wpis?',
              text: 'O: Skontaktuj się z administratorem systemu, który może wykonać korekty w bazie danych.'
            },
            {
              subtitle: 'P: Dlaczego nie widzę przycisku "Dodaj"?',
              text: 'O: Upewnij się, że wprowadziłeś klucz API w odpowiedniej sekcji. Bez klucza dostępny jest tylko tryb odczytu.'
            },
            {
              subtitle: 'P: Jak mogę eksportować dane?',
              text: 'O: Użyj przeglądarki do skopiowania danych lub skontaktuj się z administratorem w sprawie eksportu do pliku.'
            }
          ]
        }
      ]
    },
    en: {
      title: 'User Guide',
      intro: 'Welcome to Arkuszownia SMB - a comprehensive production management system. This guide will help you fully utilize the application capabilities.',
      sections: [
        {
          title: '📋 Order Management',
          items: [
            {
              subtitle: 'Viewing orders',
              text: 'On the main page, you will see a list of all orders. Each order contains information about ID, customer, status, and due date.'
            },
            {
              subtitle: 'Creating a new order',
              steps: [
                'Click the "Create Order" button in the form section',
                'Fill in required fields: Order ID and Customer ID',
                'Select order status (New, Planned, In Production, Done, Invoiced)',
                'Optionally set a due date',
                'Click "Add Order"'
              ]
            },
            {
              subtitle: 'Order statuses',
              list: [
                'New - Order has been created',
                'Planned - Order is in planning phase',
                'In Production - Order is being processed',
                'Done - Production has been completed',
                'Invoiced - Order has been invoiced'
              ]
            }
          ]
        },
        {
          title: '💰 Finance Panel',
          items: [
            {
              subtitle: 'Order financial overview',
              text: 'After selecting an order from the list, the right panel will display financial details.'
            },
            {
              list: [
                'Revenue - Total order revenue',
                'Material Cost - Raw materials and supplies costs',
                'Labor Cost - Labor costs',
                'Gross Margin - Gross profit (Revenue - Costs)'
              ]
            }
          ]
        },
        {
          title: '📦 Inventory Management',
          items: [
            {
              subtitle: 'Recording inventory movements',
              steps: [
                'In the "Inventory" section, fill out the form',
                'Enter Transaction ID (unique identifier)',
                'Select a product from the dropdown',
                'Enter quantity change (positive for receipt, negative for issue)',
                'Select reason: PO (Purchase Order), WO (Work Order), Sale, Adjust (Adjustment)',
                'Click "Add Inventory Movement"'
              ]
            }
          ]
        },
        {
          title: '⏱️ Timesheet Management',
          items: [
            {
              subtitle: 'Recording work time',
              steps: [
                'In the "Timesheet" section, fill out the form',
                'Enter Employee ID',
                'Enter Order ID related to the work',
                'Enter number of hours worked',
                'Optionally add notes',
                'Click "Add Timesheet"'
              ]
            }
          ]
        },
        {
          title: '📝 Order Lines',
          items: [
            {
              subtitle: 'Adding items to an order',
              steps: [
                'Use the "Add Order Line" section',
                'Select an order from the list',
                'Select a product',
                'Enter quantity',
                'Enter unit price',
                'Optionally set discount (0-90%)',
                'Click "Add Line"'
              ]
            }
          ]
        },
        {
          title: '🔐 Permission System',
          items: [
            {
              subtitle: 'Access levels',
              list: [
                'Without API key - Read-only access (view data)',
                'With API key - Full access to create and modify data',
                'With Admin key - API key and user management'
              ]
            },
            {
              subtitle: 'How to get an API key?',
              text: 'Contact the system administrator who will create a unique API key for you.'
            }
          ]
        },
        {
          title: '🛠️ Admin Panel',
          items: [
            {
              subtitle: 'API Key Management (admin only)',
              steps: [
                'Click "Admin" in the top menu',
                'Enter administrator key',
                'View list of all active API keys',
                'Create new key by providing a label (e.g., user name)',
                'Copy generated key and share with user',
                'Delete unused keys by clicking "Delete"',
                'Use "Rotate Key" to generate a new key for existing user'
              ]
            }
          ]
        },
        {
          title: '💡 Tips and Best Practices',
          items: [
            {
              list: [
                'Regularly update order statuses',
                'Log work time promptly',
                'Use descriptive order and product IDs',
                'Check finance panel before completing orders',
                'Store API key in a secure location',
                'Do not share your API key with others',
                'Report issues or questions to the administrator'
              ]
            }
          ]
        },
        {
          title: '❓ Frequently Asked Questions',
          items: [
            {
              subtitle: 'Q: Can I edit an existing order?',
              text: 'A: Currently, the system does not support direct editing. You can create a new order with correct data.'
            },
            {
              subtitle: 'Q: How do I delete an incorrectly entered record?',
              text: 'A: Contact the system administrator who can make corrections in the database.'
            },
            {
              subtitle: 'Q: Why don\'t I see the "Add" button?',
              text: 'A: Make sure you entered the API key in the appropriate section. Without a key, only read mode is available.'
            },
            {
              subtitle: 'Q: How can I export data?',
              text: 'A: Use your browser to copy data or contact the administrator for file export.'
            }
          ]
        }
      ]
    }
  }

  const guide = content[lang]

  return (
    <div className="user-guide">
      <div className="guide-header">
        <h1>{guide.title}</h1>
        <p className="guide-intro">{guide.intro}</p>
      </div>

      <div className="guide-content">
        {guide.sections.map((section, idx) => (
          <section key={idx} className="guide-section">
            <h2>{section.title}</h2>
            {section.items.map((item, itemIdx) => (
              <div key={itemIdx} className="guide-item">
                {item.subtitle && <h3>{item.subtitle}</h3>}
                {item.text && <p>{item.text}</p>}
                {item.steps && (
                  <ol className="guide-steps">
                    {item.steps.map((step, stepIdx) => (
                      <li key={stepIdx}>{step}</li>
                    ))}
                  </ol>
                )}
                {item.list && (
                  <ul className="guide-list">
                    {item.list.map((listItem, listIdx) => (
                      <li key={listIdx}>{listItem}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        ))}
      </div>

      <div className="guide-footer">
        <p>
          {lang === 'pl'
            ? '🆘 Potrzebujesz pomocy? Skontaktuj się z administratorem systemu.'
            : '🆘 Need help? Contact the system administrator.'}
        </p>
      </div>
    </div>
  )
}

