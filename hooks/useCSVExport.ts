import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import { supabase } from '@/lib/supabase'

export type ExportType = 'expenses' | 'assets' | 'all'

export function useCSVExport() {
  const exportCSV = async (type: ExportType, fromDate: string, toDate: string) => {
    try {
      const rows: string[] = []

      if (type === 'expenses' || type === 'all') {
        const { data } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: true })

        const filtered = (data ?? []).filter(t => {
          const tDate = t.date?.slice(0, 10)
          return tDate >= fromDate && tDate <= toDate
        })

        if (filtered.length > 0) {
          rows.push('ΔΑΠΑΝΕΣ')
          rows.push('Ημερομηνία,Κατηγορία,Ποσό,Σημείωση')
          filtered.forEach(t => {
            const date = t.date ? new Date(t.date).toLocaleDateString('el-GR') : ''
            rows.push(`"${date}","${t.category ?? ''}","${t.amount}","${t.note ?? ''}"`)
          })
          rows.push('')
        }
      }

      if (type === 'assets' || type === 'all') {
        const { data: investments } = await supabase
          .from('investments')
          .select('*, investment_returns(*)')
          .order('created_at', { ascending: true })

        if (investments && investments.length > 0) {
          rows.push('ΕΠΕΝΔΥΣΕΙΣ')
          rows.push('Ημερομηνία,Όνομα,Ποσό Επένδυσης,Απόδοση,Σημείωση')
          investments.forEach(inv => {
            const date = inv.created_at ? new Date(inv.created_at).toLocaleDateString('el-GR') : ''
            rows.push(`"${date}","${inv.name ?? ''}","${inv.amount}","",""`)
            inv.investment_returns?.forEach((r: { created_at: string; amount: number; note?: string }) => {
              const rDate = r.created_at ? new Date(r.created_at).toLocaleDateString('el-GR') : ''
              rows.push(`"${rDate}","${inv.name ?? ''}","","${r.amount}","${r.note ?? ''}"`)
            })
          })
        }
      }

      if (rows.length === 0) {
        return { success: false, message: 'Δεν βρέθηκαν δεδομένα για την επιλεγμένη περίοδο.' }
      }

      const csv = '﻿' + rows.join('\n')
      const filename = `lumi_export_${fromDate}_${toDate}.csv`
      const path = `${FileSystem.documentDirectory}${filename}`

      await FileSystem.writeAsStringAsync(path, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      })

      await Sharing.shareAsync(path, {
        mimeType: 'text/csv',
        dialogTitle: 'Εξαγωγή δεδομένων Lumi',
      })

      return { success: true }
    } catch (error) {
      console.error('CSV export error:', error)
      return { success: false, message: 'Σφάλμα κατά την εξαγωγή.' }
    }
  }

  return { exportCSV }
}
