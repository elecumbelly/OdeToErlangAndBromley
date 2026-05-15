import { describe, test, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useEntityForm } from './useEntityForm';

interface FakeEntity {
  id: number;
  name: string;
  age: number;
}

interface FakeFormValues extends Record<string, unknown> {
  name: string;
  age: number;
}

const defaults: FakeFormValues = { name: '', age: 0 };
const toFormValues = (entity: FakeEntity): FakeFormValues => ({
  name: entity.name,
  age: entity.age,
});

function setup(overrides: Partial<Parameters<typeof useEntityForm<FakeEntity, FakeFormValues>>[0]> = {}) {
  const createFn = vi.fn();
  const updateFn = vi.fn();
  const onSuccess = vi.fn();
  const onError = vi.fn();
  const hook = renderHook(() =>
    useEntityForm<FakeEntity, FakeFormValues>({
      defaults,
      toFormValues,
      createFn,
      updateFn,
      onSuccess,
      onError,
      ...overrides,
    })
  );
  return { ...hook, createFn, updateFn, onSuccess, onError };
}

describe('useEntityForm', () => {
  test('starts closed with default values', () => {
    const { result } = setup();
    expect(result.current.isOpen).toBe(false);
    expect(result.current.editing).toBeNull();
    expect(result.current.values).toEqual(defaults);
    expect(result.current.error).toBeNull();
    expect(result.current.refreshKey).toBe(0);
  });

  test('open() with no entity → create mode, default values, modal open', () => {
    const { result } = setup();
    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);
    expect(result.current.editing).toBeNull();
    expect(result.current.values).toEqual(defaults);
  });

  test('open(entity) → edit mode, values seeded from the entity', () => {
    const { result } = setup();
    const entity: FakeEntity = { id: 7, name: 'Alice', age: 30 };
    act(() => result.current.open(entity));
    expect(result.current.editing).toEqual(entity);
    expect(result.current.values).toEqual({ name: 'Alice', age: 30 });
  });

  test('setField updates a single value, leaves others alone', () => {
    const { result } = setup();
    act(() => result.current.open());
    act(() => result.current.setField('name', 'Bob'));
    expect(result.current.values).toEqual({ name: 'Bob', age: 0 });
    act(() => result.current.setField('age', 42));
    expect(result.current.values).toEqual({ name: 'Bob', age: 42 });
  });

  test('submit in create mode calls createFn, closes, increments refresh', () => {
    const { result, createFn, updateFn, onSuccess } = setup();
    act(() => result.current.open());
    act(() => result.current.setField('name', 'Bob'));
    act(() => result.current.submit());
    expect(createFn).toHaveBeenCalledTimes(1);
    expect(createFn).toHaveBeenCalledWith({ name: 'Bob', age: 0 });
    expect(updateFn).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith('create', { name: 'Bob', age: 0 });
    expect(result.current.isOpen).toBe(false);
    expect(result.current.refreshKey).toBe(1);
  });

  test('submit in edit mode calls updateFn with the editing id', () => {
    const { result, createFn, updateFn, onSuccess } = setup();
    const entity: FakeEntity = { id: 11, name: 'X', age: 1 };
    act(() => result.current.open(entity));
    act(() => result.current.setField('age', 99));
    act(() => result.current.submit());
    expect(updateFn).toHaveBeenCalledWith(11, { name: 'X', age: 99 });
    expect(createFn).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith('update', { name: 'X', age: 99 });
  });

  test('validate returning a message blocks submit and sets error', () => {
    const validate = (v: FakeFormValues) => (v.name ? null : 'Name required');
    const { result, createFn } = setup({ validate });
    act(() => result.current.open());
    act(() => result.current.submit());
    expect(createFn).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Name required');
    expect(result.current.isOpen).toBe(true);
  });

  test('createFn throwing leaves the modal open and fires onError', () => {
    const boom = new Error('unique constraint');
    const { result, createFn, onError } = setup({
      createFn: vi.fn(() => {
        throw boom;
      }),
    });
    act(() => result.current.open());
    act(() => result.current.setField('name', 'Bob'));
    act(() => result.current.submit());
    expect(createFn).not.toHaveBeenCalled(); // overridden createFn was used
    expect(onError).toHaveBeenCalledWith('create', boom);
    expect(result.current.isOpen).toBe(true);
    expect(result.current.refreshKey).toBe(0);
  });

  test('close() shuts the modal and clears editing/error', () => {
    const { result } = setup();
    const entity: FakeEntity = { id: 1, name: 'A', age: 1 };
    act(() => result.current.open(entity));
    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.editing).toBeNull();
    expect(result.current.error).toBeNull();
  });

  test('bumpRefresh ticks refreshKey without touching modal state', () => {
    const { result } = setup();
    act(() => result.current.bumpRefresh());
    expect(result.current.refreshKey).toBe(1);
    act(() => result.current.bumpRefresh());
    expect(result.current.refreshKey).toBe(2);
    expect(result.current.isOpen).toBe(false);
  });

  test('reopening for edit clears stale error from previous submit', () => {
    const { result } = setup({
      validate: (v: FakeFormValues) => (v.name ? null : 'Name required'),
    });
    act(() => result.current.open());
    act(() => result.current.submit());
    expect(result.current.error).toBe('Name required');
    act(() => result.current.open({ id: 2, name: 'C', age: 5 }));
    expect(result.current.error).toBeNull();
  });
});
