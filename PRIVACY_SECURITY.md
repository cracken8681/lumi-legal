# Lumi — Privacy & Security

## Αρχές Ασφάλειας

### Authentication
- Email/password login μέσω Supabase Auth
- Face ID / Biometric: χρησιμοποιείται ΜΟΝΟ ως app lock
- Κανένα password δεν αποθηκεύεται τοπικά
- Το Face ID ξεκλειδώνει το υπάρχον session — δεν κάνει re-login
- Το session αποθηκεύεται στο AsyncStorage (encrypted από iOS/Android)

### Δεδομένα Χρήστη
- Όλα τα δεδομένα αποθηκεύονται στο Supabase (PostgreSQL)
- Row Level Security (RLS) σε ΟΛΟΥΣ τους πίνακες
- Κάθε χρήστης βλέπει ΜΟΝΟ τα δικά του δεδομένα
- Κανένα δεδομένο δεν μοιράζεται με τρίτους
- Κανένα financial credential (κάρτες, IBAN) δεν αποθηκεύεται

### Τοπική Αποθήκευση (AsyncStorage)
- language preference (EN/EL)
- biometrics_enabled (boolean)
- Supabase session token
- Κανένα password, κανένο financial data

### Κρυπτογράφηση
- HTTPS για όλες τις επικοινωνίες με Supabase
- iOS Keychain / Android Keystore για session tokens
- Face ID data: επεξεργάζεται ΜΟΝΟ από το OS — δεν φτάνει ποτέ στο app

### GDPR Compliance
- Ο χρήστης μπορεί να διαγράψει τον λογαριασμό του
- Δεν υπάρχει tracking ή analytics χωρίς συγκατάθεση
- Δεν πωλούνται δεδομένα σε τρίτους
- Δεδομένα αποθηκεύονται σε EU servers (Supabase EU West)

### Biometric Security
- Face ID / Touch ID: χρησιμοποιεί το native iOS/Android API
- Το app ΔΕΝ έχει πρόσβαση στα biometric data
- Μόνο το αποτέλεσμα (success/fail) επιστρέφεται στο app
- Preference αποθηκεύεται ως απλό boolean
