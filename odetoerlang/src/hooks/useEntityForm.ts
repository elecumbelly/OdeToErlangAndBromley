import { useCallback, useState } from 'react';

/**
 * Generic CRUD-modal-form state container.
 *
 * Most entity managers in this app (clients, contracts, billing rules, staff,
 * recruitment requests, calendar events, ...) duplicate the same five concerns:
 *   1. modal open/closed
 *   2. "are we creating or editing?" — the editing entity (or null)
 *   3. form field values
 *   4. a submit handler that branches on (2)
 *   5. a refresh tick for re-querying after success
 *
 * This hook owns all five so the call site can be:
 *   const form = useEntityForm({ defaults, toFormValues, createFn, updateFn });
 *
 * and the parent just renders a controlled form against `form.values` and
 * `form.setField(name, value)`.
 *
 * Why a single hook instead of a wrapped component:
 *   - the form layouts vary wildly per entity (one-column, two-column,
 *     nested sections), so a component would either be inflexible or
 *     reinvent a form-builder DSL.
 *   - a hook keeps the parent in charge of layout while removing the
 *     repeated open/handle/reset wiring (~6-15 useState calls per manager).
 *
 * `EntityT` is the persisted row type (with id, created_at, etc.).
 * `FormT`   is the input shape the form actually edits.
 */

export interface UseEntityFormOptions<EntityT, FormT extends Record<string, unknown>> {
  /** Values used when opening for create (or when the modal is closed). */
  defaults: FormT;
  /** Map a persisted entity to form values when opening for edit. */
  toFormValues: (entity: EntityT) => FormT;
  /**
   * Persist a new entity. Receives the form values and should return the new
   * id (or void if the underlying writer doesn't expose one).
   */
  createFn: (values: FormT) => unknown;
  /** Update an existing entity. */
  updateFn: (id: number, values: FormT) => unknown;
  /** Called once before create/update; throw to abort with a custom message. */
  validate?: (values: FormT) => string | null;
  /** Called after a successful create/update. Use to fire toasts. */
  onSuccess?: (mode: 'create' | 'update', values: FormT) => void;
  /** Called when create/update throws. Use to fire toasts; default logs. */
  onError?: (mode: 'create' | 'update', error: unknown) => void;
}

export interface UseEntityFormResult<EntityT, FormT> {
  /** True when the modal is open. */
  isOpen: boolean;
  /** The entity being edited, or null for create. */
  editing: EntityT | null;
  /** Current form values. */
  values: FormT;
  /** Validation/error message from the last submit, cleared on next open. */
  error: string | null;
  /** Monotonically incrementing tick; bump after successful submit/delete. */
  refreshKey: number;
  /** Open in create mode (uses `defaults`) or edit mode (uses `toFormValues`). */
  open: (entity?: EntityT) => void;
  /** Close the modal and reset state. */
  close: () => void;
  /** Update a single field in `values`. Typed so callers don't widen to any. */
  setField: <K extends keyof FormT>(field: K, value: FormT[K]) => void;
  /** Replace the entire values object (rare; for bulk hydration). */
  setValues: (values: FormT) => void;
  /** Submit handler suitable for `<form onSubmit={submit}>`. */
  submit: (event?: { preventDefault?: () => void }) => void;
  /** Bump `refreshKey` without going through submit (used by delete handlers). */
  bumpRefresh: () => void;
}

export function useEntityForm<EntityT extends { id: number }, FormT extends Record<string, unknown>>(
  options: UseEntityFormOptions<EntityT, FormT>
): UseEntityFormResult<EntityT, FormT> {
  const { defaults, toFormValues, createFn, updateFn, validate, onSuccess, onError } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<EntityT | null>(null);
  const [values, setValuesState] = useState<FormT>(defaults);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const open = useCallback(
    (entity?: EntityT) => {
      setError(null);
      if (entity) {
        setEditing(entity);
        setValuesState(toFormValues(entity));
      } else {
        setEditing(null);
        setValuesState(defaults);
      }
      setIsOpen(true);
    },
    [defaults, toFormValues]
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setEditing(null);
    setError(null);
    // Intentionally leave `values` untouched; the next `open` overwrites them.
    // Resetting here would cause a visible flicker during the modal close
    // animation in components that read `values` for the closing render.
  }, []);

  const setField = useCallback(<K extends keyof FormT>(field: K, value: FormT[K]) => {
    setValuesState((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setValues = useCallback((next: FormT) => {
    setValuesState(next);
  }, []);

  const bumpRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const submit = useCallback(
    (event?: { preventDefault?: () => void }) => {
      event?.preventDefault?.();
      setError(null);

      if (validate) {
        const message = validate(values);
        if (message) {
          setError(message);
          return;
        }
      }

      const mode: 'create' | 'update' = editing ? 'update' : 'create';
      try {
        if (editing) {
          updateFn(editing.id, values);
        } else {
          createFn(values);
        }
        onSuccess?.(mode, values);
        setIsOpen(false);
        setEditing(null);
        setRefreshKey((k) => k + 1);
      } catch (err) {
        if (onError) {
          onError(mode, err);
        } else {
          console.error(`[useEntityForm] ${mode} failed:`, err);
        }
        // Modal stays open on failure so the user can correct and retry.
      }
    },
    [editing, values, validate, createFn, updateFn, onSuccess, onError]
  );

  return {
    isOpen,
    editing,
    values,
    error,
    refreshKey,
    open,
    close,
    setField,
    setValues,
    submit,
    bumpRefresh,
  };
}
