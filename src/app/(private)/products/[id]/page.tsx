import ProductEditForm from "@/components/products/product_edit_form";

export default async function ProductEditPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  return <ProductEditForm mode="edit" productId={id} />;
}