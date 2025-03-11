import Pagination from "@/app/ui/invoices/pagination";
import Search from "@/app/ui/search";
import Table from "@/app/ui/invoices/table";
import { CreateInvoice } from "@/app/ui/invoices/buttons";
import { lusitana } from "@/app/ui/fonts";
import { InvoicesTableSkeleton } from "@/app/ui/skeletons";
import { Suspense } from "react";
import { fetchInvoicesPages } from "@/app/lib/data";

// 1. URL のクエリパラメータが変更されると Page コンポーネント自体が再レンダリングされる
//  1-1. 上記はNext.jsのAppRouterの機能で、クエリパラメータが変更されるとページコンポーネントが再レンダリングされる
//  1-2. Searchコンポーネントでクエリパラメータの更新を実行している
// 2. 親コンポーネントが再レンダリングされると、その子コンポーネントも再レンダリングされる(Tableなど)
//  2-1. Table内でReactHook(useStateなど)を使用している場合、選択行の情報やソートやフィルタリングの設定、入力フォームのキャッシュなどが親コンポーネントが再レンダリングされても保持される
// 3. 2-1の対策で、Suspenseのkeyで指定した値(query, currentPage)に変化があるとアンマウントして再マウントする
//  3-1. アンマウントして再マウントすると内部状態がリセットされる

// page.tsx の Page コンポーネントでは引数からクエリパラメータ等を取得できる
export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || "";
  const currentPage = Number(searchParams?.page) || 1;
  const totalPages = await fetchInvoicesPages(query);

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Invoices</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search invoices..." />
        <CreateInvoice />
      </div>
      <Suspense key={query + currentPage} fallback={<InvoicesTableSkeleton />}>
        <Table query={query} currentPage={currentPage} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}
