"use client";
// React & next
import React from "react";
import Image from "next/image";

// components
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoadingBtnEn } from "@/app/_components/layout/loadingBtn";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";

// utils
import { cn } from "@/lib/utils";

// prisma data
import { saveUploadedImage } from "@/data/uploads";
import { updateOwnerImageAdmin } from "@/data/admin/owner";

// lib
import { UploadButton } from "@/lib/upload";

// upload thing
import { deleteImageAdmin } from "@/lib/upload/actions";

// icons
import { CircleOff } from "lucide-react";

// types
type Images = { url: string | null; key: string };

type ImagesAdmin = {
  cid: number;
  image: string;
  className?: string;
  images: { url: string | null; key: string }[];
  children: React.ReactNode;
};

export default function EditUploadedImages({
  children,
  images,
  image,
  cid,
  className,
}: ImagesAdmin) {
  // on send
  const [isSending, startSending] = React.useTransition();
  // seletcted image
  const [imageUrl, setImage] = React.useState<Images>({
    url: image,
    key: images.find((i) => i.url === image)?.key ?? "",
  });
  // images
  const [imagesUrl, setImages] = React.useState<Images[]>(images ?? []);
  // upload loading
  const [loading, setLoading] = React.useState<boolean>(false);
  // command state
  const [open, setOpen] = React.useState(false);
  // save new image
  function saveImage() {
    startSending(() => {
      updateOwnerImageAdmin(cid, imageUrl.url ?? "").then((response) => {
        // if updated successfully
        if (response) {
          toast("image updated successfully");
          return;
        }
        toast("error occurred");
      });
    });
  }
  // delete image
  function deleteImage() {
    // disable uploading
    setLoading(true);
    // delete image
    startSending(() => {
      deleteImageAdmin(imageUrl.key).then((response) => {
        if (response) {
          // success
          toast("image deleted successfully");
          // set new image
          setImage({ url: "", key: "" });
          // delete this image
          const deletedImages = imagesUrl.filter((i) => i.url !== imageUrl.url);
          // update images array
          setImages(deletedImages);
          // image upload button loading
          setLoading(false);
          // return
          return;
        }
        // error
        toast("error occurred");
      });
    });
    // loading image
    setLoading(false);
  }

  // return
  return (
    <div>
      <div onClick={() => setOpen(!open)}>
        <span>
          {children ??
            (imageUrl.url ? (
              <Image
                src={imageUrl.url}
                alt="image"
                width={200}
                height={200}
                className={className}
              />
            ) : (
              <div className="border-2 rounded-lg py-2 px-3">
                <h6>choose image</h6>
              </div>
            ))}
        </span>
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="p-3">
          <DialogTitle>images</DialogTitle>
          <DialogDescription>owner{"'"}s image</DialogDescription>
          <CommandInput
            placeholder="Search images..."
            className="h-9"
            disabled={isSending}
          />
          <CommandList>
            <CommandGroup>
              <div className="grid grid-cols-3 justify-items-center gap-3">
                <div
                  onClick={() => setImage({ url: "", key: "" })}
                  className="cflex w-32 bg-zgrey-50 rounded-sm"
                >
                  <CircleOff className="w-7" />
                </div>
                {imagesUrl?.map((i, index) => (
                  <div key={index} className="cflex">
                    {
                      <Image
                        src={i.url ?? ""}
                        alt="image"
                        width={200}
                        height={200}
                        className={cn(
                          "w-32 transition-all delay-75",
                          imageUrl.url === i.url
                            ? "p-1 border-zgrey-50 border-2 rounded-sm"
                            : ""
                        )}
                        onClick={() => setImage({ url: i.url, key: i.key })}
                      />
                    }
                  </div>
                ))}
              </div>
            </CommandGroup>
          </CommandList>
          <div className="cflex gap-2 mt-3">
            <UploadButton
              className="upload-thing my-3"
              disabled={loading}
              endpoint="imageUploader"
              onUploadBegin={() => setLoading(true)}
              onClientUploadComplete={async (response) => {
                // update images array
                setImages([
                  { key: response[0].key, url: response[0].url },
                  ...images,
                ]);
                // set new image
                setImage({ url: response[0].url, key: response[0].key });
                // save image to db
                await saveUploadedImage(
                  "zadmin",
                  response[0].key,
                  response[0].url
                );
                // image upload button loading
                setLoading(false);
              }}
              onUploadError={() => {
                // error
                toast("error on upload");
                // image upload button loading
                setLoading(false);
              }}
            />
            {/* delete and save btns */}
            <div className="flex justify-between w-10/12">
              <Button onClick={() => deleteImage()} variant="destructive">
                <LoadingBtnEn loading={isSending}>delete</LoadingBtnEn>
              </Button>
              <Button onClick={() => saveImage()}>
                <LoadingBtnEn loading={isSending}>save</LoadingBtnEn>
              </Button>
            </div>
          </div>
        </div>
      </CommandDialog>
    </div>
  );
}
