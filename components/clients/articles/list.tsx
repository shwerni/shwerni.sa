// React & Next
import React from "react";

// components
import ArticleCard from "@/components/clients/articles/card";

// prisma types
import { ArticleItem } from "@/types/layout";

const Articles = ({ articles }: { articles: ArticleItem[] }) => {
  return (
    <>
      {articles.length ? (
        <div className="col-span-4 px-3 lg:px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center gap-x-3 gap-y-5">
          {articles.map((i) => (
            <React.Fragment key={i.aid}>
              <ArticleCard item={i} />
            </React.Fragment>
          ))}
        </div>
      ) : (
        <div className="col-span-4 flex flex-col items-center justify-center gap-2">
          <h3 className="text-2xl text-gray-500 font-semibold">
            لا يوجد مقالات
          </h3>
          <h6 className="text-lg text-red-500 font-medium">
            جرب تغيير الفلاتر
          </h6>
        </div>
      )}
    </>
  );
};

export default Articles;
