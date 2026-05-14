import { NewCategory } from "@/components/settings/new-category";

export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Cài đặt</h1>
      <section>
        <h2 className="text-xl font-semibold mb-2">Thêm danh mục mới</h2>
        <NewCategory />
      </section>
    </div>
  );
}