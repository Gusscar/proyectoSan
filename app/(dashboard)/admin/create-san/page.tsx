import { CreateSanForm } from "@/components/CreateSanForm";

export default function CreateSanPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Crear nuevo San
        </h1>
        <p className="text-base text-slate-600">
          Define el monto, la frecuencia y la duración del grupo de ahorro.
        </p>
      </div>
      <CreateSanForm />
    </div>
  );
}
