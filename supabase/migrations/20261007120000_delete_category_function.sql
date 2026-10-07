-- Eliminar una categoría sin perder lo que contiene (RN-26).
--
-- Los hábitos y las tareas referencian la categoría sin «on delete», así que un
-- borrado directo fallaría. Esta función los pasa antes a la Bandeja de entrada
-- (sin categoría ni sección) y borra la categoría en la misma transacción: si
-- algo falla, no se mueve ni se borra nada. Las secciones caen en cascada.
--
-- Es «security invoker»: se ejecuta con los permisos de quien la llama, así que
-- las políticas RLS siguen decidiendo qué filas puede tocar. Si la categoría es
-- de otro usuario, no la ve, no borra nada y recibe «category_not_found».
create function public.delete_category(target_category_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  -- Se incluyen los archivados: siguen perteneciendo a la categoría.
  update public.habits
    set category_id = null, section_id = null
    where category_id = target_category_id;

  update public.tasks
    set category_id = null, section_id = null
    where category_id = target_category_id;

  delete from public.categories
    where id = target_category_id;

  get diagnostics deleted_count = row_count;
  if deleted_count = 0 then
    -- La excepción deshace también los movimientos de arriba.
    raise exception 'category_not_found' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.delete_category(uuid) from public, anon;
grant execute on function public.delete_category(uuid) to authenticated;
