import React, { useState, useMemo, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import {
  Student, Teacher, Staff, Expense, ExpenseCategory, expenseCategories,
  Payment, SalaryPayment, Classe, AppState, AppSettings,
} from '../types';
import { CrudManagerPage } from '../components/CrudManagerPage';
import { Button, Input, Select, Textarea, Card, Modal, FormRow, useToast, useConfirm } from '../components/ui';
import { PrinterIcon, FileDownIcon } from '../components/icons';
import { formatCurrency, formatDate, formatMonth } from '../utils/formatters';
import { getSchoolYear, getMonthsForSchoolYear, getOverdueStatus } from '../utils/schoolYear';
import { numberToWordsFr } from '../utils/numberToWords';
import { getPhotoOrAvatar } from '../utils/avatar';
import { generatePaySlipPdf } from '../utils/pdfGenerator';

// =============================================
// Composant Recu Modernise
// =============================================
const ReceiptModal = ({
  payment, student, classe, settings, allPayments, onClose, onDelete,
}: {
  payment: Payment; student: Student; classe: Classe | undefined; settings: AppSettings; allPayments: Payment[]; onClose: () => void; onDelete?: (id: string) => void;
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const receiptNo = String(payment.receipt_no).padStart(6, '0');
  const studentFullName = `${student.prenom} ${student.nom.toUpperCase()}`;
  const sanitizedName = `${student.prenom}_${student.nom}`.replace(/[^a-zA-Z0-9_-]/g, '_');

  // Historique des paiements de l'annee academique pour cet etudiant
  const yearPayments = useMemo(() =>
    allPayments
      .filter((p) => p.student_id === student.id && p.school_year === payment.school_year)
      .sort((a, b) => a.month.localeCompare(b.month)),
    [allPayments, student.id, payment.school_year],
  );
  const totalYearPaid = yearPayments.reduce((sum, p) => sum + p.amount, 0);

  const captureReceipt = useCallback(async () => {
    if (!receiptRef.current) return null;
    return await html2canvas(receiptRef.current, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });
  }, []);

  const handlePrint = async () => {
    const canvas = await captureReceipt();
    if (!canvas) return;
    const imgData = canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>Recu - ${studentFullName}</title>
        <style>@page{margin:0}body{margin:0;display:flex;justify-content:center}img{width:100%;max-width:800px}</style>
        </head><body><img src="${imgData}"></body></html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { printWindow.print(); printWindow.close(); }, 400);
    }
  };

  const handleDownload = async () => {
    const canvas = await captureReceipt();
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `Recu_${receiptNo}_${sanitizedName}_${payment.date}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Recu de Paiement N\u00B0 ${receiptNo}`} size="4xl">
      {/* === RECEIPT RENDER AREA === */}
      <div ref={receiptRef} style={{ width: '700px', fontFamily: "'Segoe UI', Arial, sans-serif", position: 'relative', overflow: 'hidden' }}
           className="mx-auto bg-white text-gray-800 shadow-2xl">

        {/* Watermark */}
        {settings.watermark_enabled && settings.receipt_logo_path && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: settings.watermark_opacity || 0.06,
            pointerEvents: 'none', zIndex: 0,
          }}>
            <img src={settings.receipt_logo_path} alt="" style={{
              width: `${(settings.watermark_scale || 1) * 300}px`,
              height: 'auto',
            }} />
          </div>
        )}

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Top Accent Bar */}
          <div style={{ height: '6px', background: 'linear-gradient(to right, #0a8bd0, #2ecc71, #0a8bd0)' }} />

          {/* Header */}
          <div style={{ padding: '20px 28px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0a8bd0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {settings.receipt_logo_path && (
                <img src={settings.receipt_logo_path} alt="Logo" style={{ height: '64px', width: 'auto', borderRadius: '8px' }} />
              )}
              <div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0a8bd0', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  {settings.ecole_nom}
                </div>
                {settings.slogan_ecole && (
                  <div style={{ fontSize: '11px', color: '#666', fontStyle: 'italic', marginTop: '2px' }}>
                    {settings.slogan_ecole}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: '#555', marginTop: '4px', lineHeight: '1.5' }}>
                  {settings.adresse_ecole}<br />
                  Tel: {settings.telephone_ecole}
                  {settings.email_ecole && <> | {settings.email_ecole}</>}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                background: 'linear-gradient(135deg, #0a8bd0, #065a8c)',
                color: '#fff', padding: '8px 18px', borderRadius: '8px',
                fontSize: '16px', fontWeight: 700, letterSpacing: '1px',
              }}>
                RECU DE PAIEMENT
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#555' }}>
                <div><strong>N\u00B0:</strong> <span style={{ fontFamily: 'monospace', color: '#0a8bd0', fontWeight: 700, fontSize: '14px' }}>{receiptNo}</span></div>
                <div><strong>Date:</strong> {formatDate(payment.date)}</div>
                <div><strong>Annee:</strong> {payment.school_year}</div>
              </div>
            </div>
          </div>

          {/* Student Info Card */}
          <div style={{ margin: '16px 28px', padding: '14px 18px', background: '#f0f9ff', borderRadius: '10px', border: '1px solid #bae0f5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img
                src={getPhotoOrAvatar(student.photo_path, student.prenom, student.nom)}
                alt={studentFullName}
                style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #0a8bd0' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>
                  Recu de
                </div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: '#1a1a1a' }}>
                  {studentFullName}
                </div>
                <div style={{ display: 'flex', gap: '24px', marginTop: '4px', fontSize: '12px', color: '#555' }}>
                  <span><strong>Matricule:</strong> {student.id}</span>
                  <span><strong>Classe:</strong> {student.classe}</span>
                  <span><strong>Eglise:</strong> {student.eglise_locale}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Amount in words */}
          <div style={{ margin: '0 28px 12px', padding: '10px 16px', background: '#f8fdf0', borderRadius: '8px', border: '1px solid #d4edaf', fontSize: '13px' }}>
            <strong>La somme de:</strong>{' '}
            <span style={{ fontStyle: 'italic', color: '#2d6a0e' }}>
              {numberToWordsFr(payment.amount)} francs CFA
            </span>
          </div>

          {/* Current Payment Detail */}
          <div style={{ margin: '0 28px 12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #0a8bd0, #065a8c)' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#fff', fontWeight: 600, borderRadius: '8px 0 0 0' }}>Description</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', color: '#fff', fontWeight: 600 }}>Mois</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', color: '#fff', fontWeight: 600 }}>Methode</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', color: '#fff', fontWeight: 600, borderRadius: '0 8px 0 0' }}>Montant</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 14px' }}>Frais de scolarite</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>{formatMonth(payment.month)}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                      background: payment.method === 'Especes' ? '#fef3cd' : payment.method === 'Mobile Money' ? '#d1ecf1' : '#d4edda',
                      color: payment.method === 'Especes' ? '#856404' : payment.method === 'Mobile Money' ? '#0c5460' : '#155724',
                    }}>
                      {payment.method}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(payment.amount)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr style={{ background: '#f0f9ff' }}>
                  <td colSpan={3} style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, fontSize: '14px', color: '#0a8bd0' }}>
                    TOTAL PAYE
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, fontSize: '16px', color: '#0a8bd0' }}>
                    {formatCurrency(payment.amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Historique des paiements de l'annee academique */}
          {yearPayments.length > 1 && (
            <div style={{ margin: '0 28px 16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#333', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Historique des paiements — Annee {payment.school_year}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ padding: '6px 10px', textAlign: 'center', color: '#475569', fontWeight: 600 }}>N\u00B0</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Mois</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center', color: '#475569', fontWeight: 600 }}>Date de paiement</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center', color: '#475569', fontWeight: 600 }}>Methode</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right', color: '#475569', fontWeight: 600 }}>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {yearPayments.map((p, idx) => {
                    const isCurrent = p.id === payment.id;
                    return (
                      <tr key={p.id} style={{
                        borderBottom: '1px solid #e2e8f0',
                        background: isCurrent ? '#dbeafe' : (idx % 2 === 0 ? '#fff' : '#f8fafc'),
                      }}>
                        <td style={{ padding: '6px 10px', textAlign: 'center', fontFamily: 'monospace', color: '#64748b' }}>
                          {String(p.receipt_no).padStart(6, '0')}
                        </td>
                        <td style={{ padding: '6px 10px', fontWeight: isCurrent ? 700 : 400 }}>
                          {formatMonth(p.month)}
                          {isCurrent && (
                            <span style={{
                              marginLeft: '6px', fontSize: '9px', background: '#0a8bd0', color: '#fff',
                              padding: '1px 6px', borderRadius: '10px', verticalAlign: 'middle',
                            }}>ACTUEL</span>
                          )}
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'center' }}>{formatDate(p.date)}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'center' }}>{p.method}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(p.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f0f9ff', borderTop: '2px solid #0a8bd0' }}>
                    <td colSpan={4} style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, fontSize: '12px', color: '#0a8bd0' }}>
                      TOTAL ANNEE {payment.school_year}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, fontSize: '13px', color: '#0a8bd0' }}>
                      {formatCurrency(totalYearPaid)}
                    </td>
                  </tr>
                  {classe && (
                    <tr style={{ background: '#f8fafc' }}>
                      <td colSpan={4} style={{ padding: '6px 10px', textAlign: 'right', fontSize: '11px', color: '#64748b' }}>
                        Frais annuels ({classe.nom}): {formatCurrency(classe.frais_scolarite * 10)} | Reste a payer:
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: (classe.frais_scolarite * 10 - totalYearPaid) > 0 ? '#dc2626' : '#16a34a' }}>
                        {formatCurrency(Math.max(0, classe.frais_scolarite * 10 - totalYearPaid))}
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          )}

          {/* Si c'est le seul paiement, afficher le total annuel quand meme */}
          {yearPayments.length === 1 && classe && (
            <div style={{ margin: '0 28px 16px', padding: '8px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>
                Frais annuels ({classe.nom}): {formatCurrency(classe.frais_scolarite * 10)}
              </span>
              <span style={{ fontWeight: 700, color: (classe.frais_scolarite * 10 - totalYearPaid) > 0 ? '#dc2626' : '#16a34a' }}>
                Reste a payer: {formatCurrency(Math.max(0, classe.frais_scolarite * 10 - totalYearPaid))}
              </span>
            </div>
          )}

          {/* Note */}
          {payment.note && (
            <div style={{ margin: '0 28px 12px', padding: '8px 14px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a', fontSize: '12px', color: '#92400e' }}>
              <strong>Note:</strong> {payment.note}
            </div>
          )}

          {/* Footer: Signatures + Stamp */}
          <div style={{ margin: '8px 28px 0', padding: '16px 0', borderTop: '1px dashed #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ borderBottom: '1px solid #999', width: '160px', margin: '0 auto 6px', height: '40px' }} />
              <div style={{ fontSize: '11px', color: '#666' }}>L'Etudiant</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              {settings.receipt_stamp_path ? (
                <img src={settings.receipt_stamp_path} alt="Cachet" style={{ height: '80px', width: 'auto', margin: '0 auto', display: 'block' }} />
              ) : (
                <div style={{
                  width: '90px', height: '90px', margin: '0 auto', borderRadius: '50%',
                  border: '3px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', color: '#aaa', textAlign: 'center', lineHeight: '1.3',
                }}>
                  Cachet<br />de l'ecole
                </div>
              )}
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ borderBottom: '1px solid #999', width: '160px', margin: '0 auto 6px', height: '40px' }} />
              <div style={{ fontSize: '11px', color: '#666' }}>Le Directeur / La Direction</div>
            </div>
          </div>

          {/* Bottom Accent Bar */}
          <div style={{ height: '4px', background: 'linear-gradient(to right, #0a8bd0, #2ecc71, #0a8bd0)', marginTop: '12px' }} />

          {/* Micro Footer */}
          <div style={{ padding: '8px 28px', textAlign: 'center', fontSize: '10px', color: '#999' }}>
            Ce recu est un document officiel de {settings.ecole_nom}. Conservez-le precieusement.
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-between">
        <div>
          {onDelete && (
            <Button variant="danger" onClick={() => onDelete(payment.id)}>
              Annuler ce paiement
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose}>Fermer</Button>
          <Button variant="secondary" onClick={handleDownload}>
            <FileDownIcon className="w-5 h-5 mr-2" /> Telecharger PNG
          </Button>
          <Button onClick={handlePrint}>
            <PrinterIcon className="w-5 h-5 mr-2" /> Imprimer
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// =============================================
// Formulaire de paiement
// =============================================
const PaymentForm = ({
  student, month, classe, onSave, onCancel,
}: {
  student: Student; month: string; classe: Classe | undefined;
  onSave: (p: Omit<Payment, 'id' | 'receipt_no'>) => void; onCancel: () => void; state: AppState;
}) => {
  const [formData, setFormData] = useState({
    amount: classe?.frais_scolarite || 0,
    date: new Date().toISOString().split('T')[0],
    method: 'Especes' as Payment['method'],
    note: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      student_id: student.id,
      month,
      amount: formData.amount,
      date: formData.date,
      method: formData.method,
      note: formData.note,
      school_year: getSchoolYear(new Date(month)),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center gap-3 mb-4 p-3 bg-brand-surface rounded-lg">
        <img src={getPhotoOrAvatar(student.photo_path, student.prenom, student.nom)} alt="" className="w-10 h-10 rounded-full object-cover" />
        <div>
          <p className="font-semibold">{student.prenom} {student.nom.toUpperCase()}</p>
          <p className="text-sm text-brand-text-secondary">{student.classe} | {formatMonth(month)}</p>
        </div>
      </div>
      <FormRow>
        <Input label="Montant (FCFA)" type="number" name="amount" value={formData.amount} onChange={handleChange} required />
        <Input label="Date de paiement" type="date" name="date" value={formData.date} onChange={handleChange} required />
      </FormRow>
      <FormRow>
        <Select label="Methode de paiement" name="method" value={formData.method} onChange={handleChange}>
          <option>Especes</option><option>Mobile Money</option><option>Virement</option><option>Cheque</option>
        </Select>
      </FormRow>
      <Textarea label="Note (optionnel)" name="note" value={formData.note} onChange={handleChange} rows={2} />
      <div className="flex justify-end space-x-2 mt-6">
        <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit">Enregistrer Paiement</Button>
      </div>
    </form>
  );
};

// =============================================
// Gestionnaire des frais de scolarite
// =============================================
const FeePaymentsManager = ({ state, updateState }: { state: AppState; updateState: (updater: (prevState: AppState) => AppState) => void }) => {
  const [filterClass, setFilterClass] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentModal, setPaymentModal] = useState<{ student: Student; month: string } | null>(null);
  const [receiptModal, setReceiptModal] = useState<Payment | null>(null);
  const { toast } = useToast();
  const { confirm } = useConfirm();

  const schoolYear = getSchoolYear(new Date(), state.settings.school_year_override);
  const months = getMonthsForSchoolYear(schoolYear);

  const filteredStudents = useMemo(() => {
    return state.students
      .filter((s) => !filterClass || s.classe === filterClass)
      .filter((s) => {
        if (!searchQuery) return true;
        const lowerQuery = searchQuery.toLowerCase();
        return `${s.prenom} ${s.nom}`.toLowerCase().includes(lowerQuery) || s.id.toLowerCase().includes(lowerQuery);
      });
  }, [state.students, filterClass, searchQuery]);

  const handleSavePayment = (paymentData: Omit<Payment, 'id' | 'receipt_no'>) => {
    updateState((prev) => {
      const newPayment: Payment = {
        ...paymentData,
        id: `PAY${prev.next_payment_id}`,
        receipt_no: prev.next_receipt_no,
      };
      return {
        ...prev,
        payments: [...prev.payments, newPayment],
        next_payment_id: prev.next_payment_id + 1,
        next_receipt_no: prev.next_receipt_no + 1,
      };
    });
    setPaymentModal(null);
    toast('Paiement enregistre avec succes', 'success');
  };

  const handleDeletePayment = async (paymentId: string) => {
    const ok = await confirm({
      title: 'Annuler ce paiement ?',
      message: 'Cette action supprimera definitivement ce paiement. Le recu ne sera plus valide.',
      confirmLabel: 'Supprimer le paiement',
      variant: 'danger',
    });
    if (ok) {
      updateState((prev) => ({
        ...prev,
        payments: prev.payments.filter((p) => p.id !== paymentId),
      }));
      setReceiptModal(null);
      toast('Paiement annule', 'warning');
    }
  };

  const studentPayments = useMemo(() => {
    const map = new Map<string, Payment>();
    state.payments.forEach((p) => map.set(`${p.student_id}-${p.month}`, p));
    return map;
  }, [state.payments]);

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        <Input type="text" placeholder="Rechercher un etudiant..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="max-w-xs" />
        <Select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="max-w-xs">
          <option value="">Toutes les classes</option>
          {state.classes.map((c) => <option key={c.id} value={c.nom}>{c.nom}</option>)}
        </Select>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead>
            <tr className="border-b border-brand-border">
              <th className="p-3 sticky left-0 bg-brand-surface z-10">Etudiant</th>
              {months.map((m) => (
                <th key={m} className="p-3 text-center">{new Date(m + '-02').toLocaleString('fr-FR', { month: 'short' })}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id} className="border-b border-brand-border hover:bg-brand-bg">
                <td className="p-3 font-semibold sticky left-0 bg-brand-surface z-10">
                  <div className="flex items-center">
                    <img src={getPhotoOrAvatar(student.photo_path, student.prenom, student.nom)} alt={student.nom} className="w-8 h-8 rounded-full mr-2 object-cover" />
                    <div>
                      <p>{student.prenom} {student.nom.toUpperCase()}</p>
                      <p className="text-xs text-brand-text-secondary">{student.classe}</p>
                    </div>
                  </div>
                </td>
                {months.map((month) => {
                  const payment = studentPayments.get(`${student.id}-${month}`);
                  const [year, m] = month.split('-').map(Number);
                  const status = getOverdueStatus(state.settings, !!payment, year, m);
                  return (
                    <td key={month} className="p-3 text-center">
                      {payment ? (
                        <button onClick={() => setReceiptModal(payment)} className="bg-brand-success/20 text-brand-success px-2 py-1 rounded text-xs font-semibold">
                          {formatCurrency(payment.amount)}
                        </button>
                      ) : (
                        <button
                          onClick={() => status.canPay && setPaymentModal({ student, month })}
                          disabled={!status.canPay}
                          className={`text-xs px-2 py-1 rounded ${status.canPay ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                        >
                          <span className={status.color}>{status.label}</span>
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {paymentModal && (
        <Modal isOpen={true} onClose={() => setPaymentModal(null)} title="Enregistrer un paiement">
          <PaymentForm
            student={paymentModal.student}
            month={paymentModal.month}
            classe={state.classes.find((c) => c.nom === paymentModal.student.classe)}
            onSave={handleSavePayment}
            onCancel={() => setPaymentModal(null)}
            state={state}
          />
        </Modal>
      )}

      {receiptModal && (
        <ReceiptModal
          payment={receiptModal}
          student={state.students.find((s) => s.id === receiptModal.student_id)!}
          classe={state.classes.find((c) => c.nom === state.students.find((s) => s.id === receiptModal.student_id)!.classe)}
          settings={state.settings}
          allPayments={state.payments}
          onClose={() => setReceiptModal(null)}
          onDelete={handleDeletePayment}
        />
      )}
    </div>
  );
};

// =============================================
// Formulaire de depenses
// =============================================
const ExpenseForm = ({
  item, onSave, onCancel,
}: {
  item: Expense | null; onSave: (e: Expense) => void; onCancel: () => void; state: AppState;
}) => {
  const [formData, setFormData] = useState<Omit<Expense, 'id'>>(() =>
    item ? { ...item } : { date: new Date().toISOString().split('T')[0], description: '', category: 'Autre', amount: 0 },
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: Math.max(0, parseFloat(value) || 0) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ ...formData, id: item?.id || '' }); }}>
      <FormRow>
        <Input label="Date" name="date" type="date" value={formData.date} onChange={handleChange} required />
        <Input label="Montant (FCFA)" name="amount" type="number" value={formData.amount} onChange={handleChange} required />
      </FormRow>
      <FormRow>
        <Select label="Categorie" name="category" value={formData.category} onChange={handleChange}>
          {expenseCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </Select>
      </FormRow>
      <Textarea label="Description" name="description" value={formData.description} onChange={handleChange} required rows={3} />
      <div className="flex justify-end space-x-2 mt-6">
        <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>
  );
};

const ExpenseManager = ({ state, updateState }: { state: AppState; updateState: (updater: (prevState: AppState) => AppState) => void }) => (
  <CrudManagerPage
    title="Depenses"
    items={state.expenses}
    updateState={updateState}
    FormComponent={ExpenseForm}
    generateNewId={(s) => `EXP${s.next_expense_id}`}
    columns={[
      { header: 'Date', accessor: (e) => formatDate(e.date) },
      { header: 'Description', accessor: (e) => e.description },
      { header: 'Categorie', accessor: (e) => e.category },
      { header: 'Montant', accessor: (e) => formatCurrency(e.amount), className: 'text-right' },
    ]}
    searchFields={['description', 'category']}
    state={state}
    updateItems={(s, newItems) => ({
      ...s,
      expenses: newItems as Expense[],
      next_expense_id: s.next_expense_id + (newItems.length > s.expenses.length ? 1 : 0),
    })}
    modalSize="2xl"
  />
);

// =============================================
// Formulaire de paiement de salaire
// =============================================
const SalaryPaymentForm = ({
  employee, month, onSave, onCancel,
}: {
  employee: Teacher | Staff; month: string;
  onSave: (p: Omit<SalaryPayment, 'id'>) => void; onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    amount: employee.salaire_mensuel,
    date: new Date().toISOString().split('T')[0],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ employee_id: employee.id, month, amount: formData.amount, date: formData.date }); }}>
      <div className="flex items-center gap-3 mb-4 p-3 bg-brand-surface rounded-lg">
        <img src={getPhotoOrAvatar(employee.photo_path, employee.prenom, employee.nom)} alt="" className="w-10 h-10 rounded-full object-cover" />
        <div>
          <p className="font-semibold">{employee.prenom} {employee.nom.toUpperCase()}</p>
          <p className="text-sm text-brand-text-secondary">{'role' in employee ? employee.role : ('matiere' in employee ? employee.matiere : '')} | {formatMonth(month)}</p>
        </div>
      </div>
      <FormRow>
        <Input label="Montant du salaire (FCFA)" type="number" name="amount" value={formData.amount} onChange={handleChange} required />
        <Input label="Date de paiement" type="date" name="date" value={formData.date} onChange={handleChange} required />
      </FormRow>
      <div className="flex justify-end space-x-2 mt-6">
        <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit">Enregistrer Paiement</Button>
      </div>
    </form>
  );
};

// =============================================
// Gestionnaire des salaires
// =============================================
const SalaryManager = ({ state, updateState }: { state: AppState; updateState: (updater: (prevState: AppState) => AppState) => void }) => {
  const [paymentModal, setPaymentModal] = useState<{ employee: Teacher | Staff; month: string } | null>(null);
  const { toast } = useToast();
  const employees = useMemo(() => [...state.teachers, ...state.staff], [state.teachers, state.staff]);

  const schoolYear = getSchoolYear(new Date(), state.settings.school_year_override);
  const months = getMonthsForSchoolYear(schoolYear);

  const salaryPayments = useMemo(() => {
    const map = new Map<string, SalaryPayment>();
    state.salaryPayments.forEach((p) => map.set(`${p.employee_id}-${p.month}`, p));
    return map;
  }, [state.salaryPayments]);

  const handleSavePayment = (paymentData: Omit<SalaryPayment, 'id'>) => {
    updateState((prev) => {
      const newPayment: SalaryPayment = { ...paymentData, id: `SAL${prev.next_salary_payment_id}` };
      return {
        ...prev,
        salaryPayments: [...prev.salaryPayments, newPayment],
        next_salary_payment_id: prev.next_salary_payment_id + 1,
      };
    });
    setPaymentModal(null);
    toast('Salaire enregistre avec succes', 'success');
  };

  const handleDownloadPaySlip = (employee: Teacher | Staff, payment: SalaryPayment) => {
    try {
      generatePaySlipPdf(employee, payment, state.salaryPayments, state.settings);
      toast('Bulletin de paye telecharge', 'success');
    } catch {
      toast('Erreur lors de la generation du bulletin', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead>
            <tr className="border-b border-brand-border">
              <th className="p-3 sticky left-0 bg-brand-surface z-10">Employe</th>
              {months.map((m) => (
                <th key={m} className="p-3 text-center">{new Date(m + '-02').toLocaleString('fr-FR', { month: 'short' })}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id} className="border-b border-brand-border hover:bg-brand-bg">
                <td className="p-3 font-semibold sticky left-0 bg-brand-surface z-10">
                  <div className="flex items-center">
                    <img src={getPhotoOrAvatar(employee.photo_path, employee.prenom, employee.nom)} alt={employee.nom} className="w-8 h-8 rounded-full mr-2 object-cover" />
                    <div>
                      <p>{employee.prenom} {employee.nom.toUpperCase()}</p>
                      <p className="text-xs text-brand-text-secondary">{'role' in employee ? employee.role : employee.matiere}</p>
                    </div>
                  </div>
                </td>
                {months.map((month) => {
                  const payment = salaryPayments.get(`${employee.id}-${month}`);
                  return (
                    <td key={month} className="p-3 text-center">
                      {payment ? (
                        <button
                          onClick={() => handleDownloadPaySlip(employee, payment)}
                          className="bg-brand-success/20 text-brand-success px-2 py-1 rounded text-xs font-semibold inline-flex items-center gap-1 hover:bg-brand-success/30 transition-colors"
                          title="Cliquez pour telecharger le bulletin de paye"
                        >
                          <FileDownIcon className="w-3 h-3" />
                          {formatCurrency(payment.amount)}
                        </button>
                      ) : (
                        <Button variant="secondary" size="sm" className="text-xs px-2 py-1" onClick={() => setPaymentModal({ employee, month })}>
                          Payer
                        </Button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {paymentModal && (
        <Modal isOpen={true} onClose={() => setPaymentModal(null)} title="Payer le salaire">
          <SalaryPaymentForm employee={paymentModal.employee} month={paymentModal.month} onSave={handleSavePayment} onCancel={() => setPaymentModal(null)} />
        </Modal>
      )}
    </div>
  );
};

// =============================================
// Page Finances principale
// =============================================
export const FinancesPage = ({ state, updateState }: { state: AppState; updateState: (updater: (prevState: AppState) => AppState) => void }) => {
  const [activeTab, setActiveTab] = useState('fees');

  const TabButton = ({ tabName, label }: { tabName: string; label: string }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-4 py-2 font-semibold rounded-t-lg transition-colors duration-200 ${activeTab === tabName ? 'bg-brand-surface text-brand-primary' : 'text-brand-text-secondary hover:bg-brand-bg-dark'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold">Finances</h1>
      <div className="border-b border-brand-border">
        <TabButton tabName="fees" label="Frais de Scolarite" />
        <TabButton tabName="expenses" label="Depenses" />
        <TabButton tabName="salaries" label="Salaires" />
      </div>
      <div className="pt-4">
        {activeTab === 'fees' && <FeePaymentsManager state={state} updateState={updateState} />}
        {activeTab === 'expenses' && <ExpenseManager state={state} updateState={updateState} />}
        {activeTab === 'salaries' && <SalaryManager state={state} updateState={updateState} />}
      </div>
    </div>
  );
};
