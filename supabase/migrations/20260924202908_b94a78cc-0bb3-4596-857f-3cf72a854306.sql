ALTER TABLE public.casks ADD CONSTRAINT casks_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE SET NULL;
NOTIFY pgrst, 'reload schema';