import { useMemo } from 'react'

export default function UserGuide(props) {
  const { lang, onClose } = props
  const content = useMemo(
    () => ({
      pl: {
        title: 'Przewodnik Użytkownika',
        intro:
          'Witamy w Synterra – systemie zarządzania produkcją dla małych i średnich przedsiębiorstw. Ten przewodnik pomoże Ci wykorzystać wszystkie kluczowe funkcje aplikacji.',
        navigationIntro:
          'Górny pasek nawigacji działa podobnie jak w nowoczesnych aplikacjach webowych. Logo po lewej przenosi Cię na stronę główną, a przycisk „Panel główny” (Home) zawsze wraca do kafelkowego widoku startowego – niezależnie od tego, w której sekcji aktualnie pracujesz.',
        navigationItems: [
          'Panel główny – szybki powrót do ekranu kafelków z najważniejszymi modułami.',
          'Zamówienia, Klienci, Magazyn, Czas pracy, Raporty – przełączanie między głównymi widokami systemu.',
          'Szukaj – pasek wyszukiwania u góry ułatwia znajdowanie zamówień lub klientów.',
          'PL / EN – przełączanie języka interfejsu.',
          'Pomoc – otwiera ten przewodnik użytkownika w aktualnym języku.',
          'Menu profilu – pozwala przejść do ustawień konta i wylogować się.'
        ],
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
            title: '🧑‍💼 Panel Administratora',
            items: [
              {
                subtitle: 'Zarządzanie użytkownikami',
                steps: [
                  'Otwórz panel „Admin” w górnym pasku nawigacji.',
                  'Uwierzytelnij się kluczem administratora (lub kontem z rolą admin).',
                  'W sekcji „Dodaj użytkownika” wpisz adres e‑mail i hasło (min. 8 znaków).',
                  'Zaznacz opcję „Administrator”, jeśli konto ma mieć pełne uprawnienia.',
                  'Kliknij „Utwórz”, aby dodać użytkownika do systemu.',
                  'Na liście poniżej zobaczysz wszystkich użytkowników wraz z rolami – możesz ich usuwać jednym kliknięciem.'
                ]
              },
              {
                subtitle: 'Najlepsze praktyki haseł',
                list: [
                  'Używaj unikalnych, długich haseł – co najmniej 12 znaków.',
                  'Nie wysyłaj haseł zwykłym mailem – lepiej poproś użytkownika o zmianę hasła przy pierwszym logowaniu.',
                  'Nigdy nie zakładaj wspólnych kont współdzielonych przez wiele osób.'
                ]
              }
            ]
          },
          {
            title: '📤 Eksport danych (CSV)',
            items: [
              {
                subtitle: 'Eksport zamówień i magazynu',
                steps: [
                  'Przejdź do sekcji „Zamówienia” lub „Magazyn”.',
                  'Upewnij się, że widzisz listę rekordów, które chcesz wyeksportować.',
                  'Kliknij przycisk „Eksportuj CSV” w prawym górnym rogu listy.',
                  'Pobierz plik .csv i otwórz go w Excelu, LibreOffice lub Power BI / Power Query.',
                  'Jeśli plik jest pusty, upewnij się, że w tabeli znajdują się zapisane rekordy.'
                ]
              }
            ]
          },
          {
            title: '💡 Wskazówki i najlepsze praktyki',
            items: [
              {
                list: [
                  'Regularnie aktualizuj statusy zamówień, aby raporty były wiarygodne.',
                  'Rejestruj czas pracy na bieżąco – unikniesz luk w rozliczeniach.',
                  'Używaj czytelnych oznaczeń produktów i zamówień (np. KLIENT-ROK-001).',
                  'Przed zamknięciem zamówienia przejrzyj panel finansowy i raporty.',
                  'Klucze API i hasła przechowuj w menedżerze haseł – nigdy w arkuszach Excela.',
                  'Przy problemach z dostępem korzystaj z panelu „Admin” zamiast ręcznych zmian w bazie.'
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
                text: 'O: Użyj funkcji „Eksportuj CSV” w sekcji Zamówienia lub Magazyn albo skontaktuj się z administratorem, jeśli potrzebujesz bardziej zaawansowanego eksportu.'
              }
            ]
          }
        ]
      },
      en: {
        title: 'User Guide',
        intro:
          'Welcome to Synterra – a production management system for small and mid‑sized manufacturers. This guide explains all the core features so you can work efficiently.',
        navigationIntro:
          'The top navigation bar works like in modern web apps. The logo on the far left takes you back to the main screen and the “Home” / “Panel główny” button always returns to the tile‑based dashboard – no matter which section you are currently in.',
        navigationItems: [
          'Home – quick way to return to the dashboard with the main tiles.',
          'Orders, Customers, Inventory, Time tracking, Reports – switch between the core functional areas.',
          'Search – the bar at the top helps you quickly find orders or customers.',
          'PL / EN – switch the interface language.',
          'Help – opens this User Guide in the current language.',
          'Profile menu – lets you open account settings and sign out.'
        ],
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
            title: '🧑‍💼 Admin Panel',
            items: [
              {
                subtitle: 'Managing users',
                steps: [
                  'Open the “Admin” panel from the top navigation bar.',
                  'Authenticate with the administrator key (or an account with admin role).',
                  'In the “Add user” section, enter email and password (min. 8 characters).',
                  'Tick the “Administrator” checkbox if the account should have full privileges.',
                  'Click “Create” to add the user to the system.',
                  'Use the table below to see all users, their roles, and to remove accounts if needed.'
                ]
              },
              {
                subtitle: 'Password best practices',
                list: [
                  'Use unique, long passwords – at least 12 characters.',
                  'Avoid sending raw passwords via email – ask the user to change it on first login instead.',
                  'Never use shared accounts for multiple people.'
                ]
              }
            ]
          },
          {
            title: '📤 Data export (CSV)',
            items: [
              {
                subtitle: 'Exporting Orders and Inventory',
                steps: [
                  'Go to the “Orders” or “Inventory” section.',
                  'Make sure you can see the records you want to export.',
                  'Click the “Export CSV” button in the top‑right corner of the list.',
                  'Download the .csv file and open it in Excel, LibreOffice or Power BI / Power Query.',
                  'If the file is empty, verify there are saved records in the table first.'
                ]
              }
            ]
          },
          {
            title: '💡 Tips & best practices',
            items: [
              {
                list: [
                  'Keep order statuses up to date so reports stay accurate.',
                  'Log time as you work to avoid missing hours later.',
                  'Use clear, structured IDs for orders and products (e.g. CUSTOMER‑YEAR‑001).',
                  'Review the Finance panel and reports before closing an order.',
                  'Store API keys and passwords in a password manager – never in plain spreadsheets.',
                  'Use the “Admin” panel to manage access instead of manual DB changes.'
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
                subtitle: "Q: Why don't I see the \"Add\" button?",
                text: 'A: Make sure you entered the API key in the appropriate section. Without a key, only read mode is available.'
              },
              {
                subtitle: 'Q: How can I export data?',
                text: 'A: Use the “Export CSV” button in the Orders or Inventory section, or contact the administrator if you need a more advanced export.'
              }
            ]
          }
        ]
      }
    }),
    []
  )
  const guide = content[lang] || content.pl

  return (
    <div className="guide-overlay" role="dialog" aria-modal="true" aria-label={guide.title}>
      <div className="page user-guide">
        <button className="guide-close" onClick={onClose} aria-label={lang === 'pl' ? 'Zamknij przewodnik' : 'Close guide'}>
          ×
        </button>
        <header className="user-guide-header">
          <h1 className="user-guide-title">{guide.title}</h1>
          <p className="user-guide-intro">{guide.intro}</p>
        </header>

        <section className="user-guide-section">
          <h2 className="user-guide-section-title">
            {lang === 'pl' ? 'Nawigacja i pasek górny' : 'Navigation & top bar'}
          </h2>
          <p className="user-guide-text">{guide.navigationIntro}</p>
          <ul className="user-guide-list">
            {guide.navigationItems.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </section>

        {guide.sections.map((section, index) => (
          <section key={index} className="user-guide-section">
            <h2 className="user-guide-section-title">{section.title}</h2>

            {section.items.map((item, itemIndex) => (
              <article key={itemIndex} className="user-guide-block">
                {item.subtitle && (
                  <h3 className="user-guide-subtitle">{item.subtitle}</h3>
                )}

                {item.text && <p className="user-guide-text">{item.text}</p>}

                {item.list && (
                  <ul className="user-guide-list">
                    {item.list.map((entry, entryIndex) => (
                      <li key={entryIndex}>{entry}</li>
                    ))}
                  </ul>
                )}

                {item.steps && (
                  <ol className="user-guide-steps">
                    {item.steps.map((step, stepIndex) => (
                      <li key={stepIndex}>{step}</li>
                    ))}
                  </ol>
                )}
              </article>
            ))}
          </section>
        ))}

        <div className="guide-footer">
          <p>
            {lang === 'pl'
              ? '🆘 Potrzebujesz pomocy? Skontaktuj się z administratorem systemu.'
              : '🆘 Need help? Contact the system administrator.'}
          </p>
        </div>
      </div>
    </div>
  )
}
