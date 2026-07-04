
# 🔄 GIT ΠΡΩΤΟΚΟΛΛΟ ΣΥΓΧΡΟΝΙΣΜΟΥ (ΥΠΟΧΡΕΩΤΙΚΟ)

Στο project δουλεύουν πολλές μηχανές (MacBook, Mac Mini/VA). Για να μη χαθεί ποτέ δουλειά:

## Κανόνες για ΚΑΘΕ session (όλες οι μηχανές)
1. ΕΝΑΡΞΗ session: ΠΑΝΤΑ τρέξε πρώτα `git pull origin main` πριν από οποιαδήποτε αλλαγή.
2. ΛΗΞΗ session: ΠΑΝΤΑ κλείσε με `git add -A && git commit -m "..."` και `git push origin main`.
3. Αν το push απορριφθεί (non-fast-forward): ΜΗΝ κάνεις force push ΠΟΤΕ. Κάνε `git pull --no-rebase`, λύσε τα conflicts συνειδητά, μετά push.
4. ΠΟΤΕ μην αφήνεις untracked αρχεία στο τέλος session — ή commit ή stash με περιγραφικό όνομα.

## Κανόνες για τον VA (Mac Mini)
1. Ο VA δουλεύει ΜΟΝΟ σε branches με prefix `va/` (π.χ. `va/redesign-tabs`), ΠΟΤΕ απευθείας στο main.
2. Όταν τελειώσει: push το branch και άνοιγμα Pull Request στο GitHub.
3. Το merge στο main το κάνει ΜΟΝΟ ο David μετά από review.

## Κανόνες για το main
- Το main πρέπει ΠΑΝΤΑ να περνάει `npx tsc --noEmit` με 0 errors πριν από push.
- Πριν από κάθε merge στο main: δημιούργησε backup branch `backup/YYYY-MM-DD` αν το merge είναι δομικό (αλλαγές σε navigation, tabs, core hooks).
- Pre-commit hook (husky) τρέχει αυτόματα `npx tsc --noEmit` — αν μια μηχανή δεν έχει το hook, τρέξε `npm install` για να εγκατασταθεί.

## Κανόνας Context Management (Claude Code)
- Όταν το διαθέσιμο context πέσει κάτω από ~40%, ΠΡΟΤΕΙΝΕ αυτόματα στον χρήστη τη σειρά: (1) git add -A && git commit, (2) git push origin main, (3) /compact.
- ΠΟΤΕ μην αφήσεις το context να εξαντληθεί με uncommitted δουλειά — προτεραιότητα πάντα το checkpoint (commit + push) ΠΡΙΝ το /compact ή /clear.
- Στο μήνυμα-πρόταση ανέφερε συνοπτικά τι εκκρεμεί (uncommitted αρχεία, ανοιχτά tasks) ώστε το επόμενο session να συνεχίσει χωρίς απώλεια πληροφορίας.
