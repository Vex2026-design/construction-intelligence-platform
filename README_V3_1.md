# CIP V3.1 — Quantità Totale editabile

Modifica richiesta:
- in EPC Weekly Input la Qty Totale è modificabile per ogni progetto;
- quando si preme Submit EPC Update, l'app aggiorna:
  - wbs_activities.quantity_total
  - weekly_quantity_updates con qty precedente, qty settimana, cumulato e progress.

Questo serve perché ogni progetto ha quantità diverse anche se eredita la stessa struttura WBS.

Commit suggerito:
V3.1 editable WBS quantities
