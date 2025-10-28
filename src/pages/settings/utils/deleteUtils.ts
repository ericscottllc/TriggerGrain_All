import { supabase } from '../../../lib/supabase';

export async function deleteItem(
  tableName: string,
  itemId: string,
  confirmMessage: string = 'Are you sure you want to delete this item? This action cannot be undone.'
): Promise<{ success: boolean; error?: Error }> {
  if (!confirm(confirmMessage)) {
    return { success: false };
  }

  try {
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .eq('id', itemId);

    if (deleteError) throw deleteError;
    return { success: true };
  } catch (err) {
    return { success: false, error: err as Error };
  }
}
