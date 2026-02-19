import { Separator } from "@/components/ui/separator";

export default function Atitle(props: {
  title: string;
  subtitle?: string | null;
}) {
  return (
    <div className="cflex mb-10 mt-5">
      <h1 className="text-zgrey-200 sm:text-3xl text-2xl font-bold">{props.title}</h1>
      <div className="h-1 sm:w-32 w-24 my-2 bg-zblue-200 rounded-md" />
      {props.subtitle && (
        <h4 className="text-center text-base">{props.subtitle}</h4>
      )}
    </div>
  );
}

export function Btitle(props: { title: string; subtitle?: string | null }) {
  return (
    <div className="flex flex-col my-5">
      <h1 className="text-zgrey-200 sm:text-3xl text-2xl font-bold">{props.title}</h1>
      <Separator className="my-3 w-11/12 mx-auto" />
      {props.subtitle && (
        <h4 className="text-center text-base">{props.subtitle}</h4>
      )}
    </div>
  );
}
