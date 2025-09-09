import ProductEditForm from "@/components/products/product_edit_form";

export default function ProductEditPage({ params }: { params: { id: string } }) {
  return <ProductEditForm mode="edit" productId={params.id} />;
}