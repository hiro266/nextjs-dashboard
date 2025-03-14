// - use server
//   - ファイル内のすべてのエクスポートされた関数がサーバーアクションとして扱われる
//   - 関数レベルでuse serverを指定することもできる
// - サーバーアクション
//    - 関数の実行はサーバーで実行される
//      - 主にデータの変異(作成、更新、削除)や外部APIとの通信などで利用される
//    - クライアントコンポーネントやサーバーコンポーネントからAPIエンドポイントを意識せずに直接関数を呼び出すことができる
//      - 開発者が意識せずに使用できるだけで裏側でAPIエンドポイントへのPOSTリクエストが自動的に生成される
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import postgres from "postgres";

// --- 共通 ---
const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});

// --- 共通 ---

// --- 作成 ---
const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  // Tips: FormData.get(props)で個別に取得できるが、多くのフィールドがある場合はObject.formEntries()が便利
  const rawFormDataBeforeParsed = {
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  };

  // 型検証をしながら強制変換(amountがstringでくるのでnumberに変換)
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  const amountInCents = amount * 100;
  // YYYY-MM-DD」形式
  const date = new Date().toISOString().split("T")[0];

  //** 型変換前と後のamountを比較
  // console.log("--- Before Parsed amount ---");
  // console.log(rawFormDataBeforeParsed.amount);
  // console.log(typeof rawFormDataBeforeParsed.amount);
  // console.log("--- After Parsed amount ---");
  // console.log(amount);
  // console.log(typeof amount);
  // */

  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;

  // /dashboard/invoices のキャッシュをクリア
  // 「この場所の情報は古くなったから、次に誰かがここに来るときは、必ず新しい情報を確認して見せるように」
  revalidatePath("/dashboard/invoices");

  // リダイレクトの過程で、サーバー側でページコンポーネント(/dashboard/invoices/page.tsx)を再レンダリングする
  redirect("/dashboard/invoices");
}
// --- 作成 ---

// --- 更新 ---
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  const amountInCents = amount * 100;

  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}
// --- 更新 ---
