import React, { useState, useMemo, ReactNode } from 'react';
import { AppState } from '../types';
import { Button, Input, Card, Modal, useToast, useConfirm } from './ui';
import { PlusCircleIcon, EditIcon, TrashIcon } from './icons';

interface Column<T> {
  header: string;
  accessor: (item: T) => ReactNode;
  className?: string;
}

interface CrudManagerPageProps<T extends { id: string }> {
  title: string;
  items: T[];
  updateState: (updater: (prevState: AppState) => AppState) => void;
  FormComponent: React.ComponentType<{
    item: T | null;
    onSave: (item: T) => void;
    onCancel: () => void;
    state: AppState;
  }>;
  generateNewId: (state: AppState) => string;
  columns: Column<T>[];
  searchFields: (keyof T)[];
  state: AppState;
  updateItems: (state: AppState, items: T[]) => AppState;
  modalSize?: '2xl' | '4xl' | '5xl';
}

const ITEMS_PER_PAGE = 25;

export const CrudManagerPage = <T extends { id: string }>({
  title,
  items,
  updateState,
  FormComponent,
  generateNewId,
  columns,
  searchFields,
  state,
  updateItems,
  modalSize = '4xl',
}: CrudManagerPageProps<T>) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const { confirm } = useConfirm();

  const openModalForNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (item: T) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = (item: T) => {
    const isNew = !item.id || !items.some((p) => p.id === item.id);
    updateState((prevState) => {
      let updatedItems;
      if (!isNew) {
        updatedItems = items.map((p) => (p.id === item.id ? item : p));
      } else {
        const newItem = { ...item, id: generateNewId(prevState) };
        updatedItems = [...items, newItem];
      }
      return updateItems(prevState, updatedItems);
    });
    closeModal();
    toast(isNew ? 'Element ajoute avec succes' : 'Element modifie avec succes', 'success');
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Confirmer la suppression',
      message: 'Etes-vous sur de vouloir supprimer cet element ? Cette action est irreversible.',
      confirmLabel: 'Supprimer',
      variant: 'danger',
    });
    if (ok) {
      updateState((prevState) => {
        const updatedItems = items.filter((p) => p.id !== id);
        return updateItems(prevState, updatedItems);
      });
      toast('Element supprime', 'warning');
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const lowercasedQuery = searchQuery.toLowerCase();
    return items.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        return typeof value === 'string' && value.toLowerCase().includes(lowercasedQuery);
      }),
    );
  }, [items, searchQuery, searchFields]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page when search changes
  useMemo(() => setCurrentPage(1), [searchQuery]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-sm text-brand-text-secondary">{items.length} element(s)</p>
        </div>
        <Button onClick={openModalForNew}>
          <PlusCircleIcon className="w-5 h-5 mr-2" /> Ajouter
        </Button>
      </div>
      <Input
        type="text"
        placeholder="Rechercher..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-xs"
      />
      <Card className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-brand-border">
              {columns.map((col) => (
                <th key={col.header} className={`p-3 ${col.className ?? ''}`}>
                  {col.header}
                </th>
              ))}
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="p-8 text-center text-brand-text-secondary">
                  {searchQuery ? 'Aucun resultat pour cette recherche' : 'Aucun element'}
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => (
                <tr key={item.id} className="border-b border-brand-border hover:bg-brand-bg transition-colors">
                  {columns.map((col) => (
                    <td key={col.header} className={`p-3 align-top ${col.className ?? ''}`}>
                      {col.accessor(item)}
                    </td>
                  ))}
                  <td className="p-3">
                    <div className="flex items-center justify-end space-x-2">
                      <Button variant="secondary" className="p-2" onClick={() => openModalForEdit(item)}>
                        <EditIcon className="w-4 h-4" />
                      </Button>
                      <Button variant="danger" className="p-2" onClick={() => handleDelete(item.id)}>
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-brand-text-secondary">
            Page {currentPage} sur {totalPages} ({filteredItems.length} resultats)
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Precedent
            </Button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const page = totalPages <= 7 ? i + 1 : currentPage <= 4 ? i + 1 : currentPage >= totalPages - 3 ? totalPages - 6 + i : currentPage - 3 + i;
              if (page < 1 || page > totalPages) return null;
              return (
                <Button
                  key={page}
                  variant={page === currentPage ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? `Modifier ${title}` : `Ajouter ${title}`}
        size={modalSize}
      >
        <FormComponent item={editingItem} onSave={handleSave} onCancel={closeModal} state={state} />
      </Modal>
    </div>
  );
};
