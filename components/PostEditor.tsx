"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function PostEditor({
  value,
  onChange,
}: Props) {
  function wrapSelection(startTag: string, endTag: string) {
    const textarea = document.getElementById(
      "post-editor"
    ) as HTMLTextAreaElement | null;

    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const selected = value.substring(start, end);

    const newValue =
      value.substring(0, start) +
      startTag +
      selected +
      endTag +
      value.substring(end);

    onChange(newValue);

    setTimeout(() => {
      textarea.focus();

      textarea.selectionStart =
        start + startTag.length;

      textarea.selectionEnd =
        end + startTag.length;
    }, 0);
  }

  return (
    <div className="rounded-[28px] border border-black/10 overflow-hidden">

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 border-b border-black/5 bg-[#F5FFF8] p-3">

        <button
          type="button"
          onClick={() => wrapSelection("<h2>", "</h2>")}
          className="rounded-xl bg-white px-4 py-2 text-sm font-black text-[#06113C]"
        >
          H2
        </button>

        <button
          type="button"
          onClick={() => wrapSelection("<h3>", "</h3>")}
          className="rounded-xl bg-white px-4 py-2 text-sm font-black text-[#06113C]"
        >
          H3
        </button>

        <button
          type="button"
          onClick={() => wrapSelection("<strong>", "</strong>")}
          className="rounded-xl bg-white px-4 py-2 text-sm font-black text-[#06113C]"
        >
          Bold
        </button>

        <button
          type="button"
          onClick={() =>
            wrapSelection(
              "<ul>\n<li>",
              "</li>\n</ul>"
            )
          }
          className="rounded-xl bg-white px-4 py-2 text-sm font-black text-[#06113C]"
        >
          List
        </button>

        <button
          type="button"
          onClick={() =>
            wrapSelection(
              '<a href="">',
              "</a>"
            )
          }
          className="rounded-xl bg-white px-4 py-2 text-sm font-black text-[#06113C]"
        >
          Link
        </button>

        <button
          type="button"
          onClick={() =>
            wrapSelection(
              '<div class="cta-order">',
              `
<a href="/dat-mon-nhanh">
  Đặt món ngay
</a>
</div>`
            )
          }
          className="rounded-xl bg-[#00B14F] px-4 py-2 text-sm font-black text-white"
        >
          CTA Đặt món
        </button>

        <button
          type="button"
          onClick={() =>
            wrapSelection("<p>", "</p>")
          }
          className="rounded-xl bg-white px-4 py-2 text-sm font-black text-[#06113C]"
        >
          P
        </button>
      </div>

      {/* Editor */}
      <textarea
        id="post-editor"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        rows={16}
        placeholder={`Viết nội dung bài...

Ví dụ:

<h2>Bánh tráng trộn Quận 6 có gì ngon?</h2>

<p>Nội dung...</p>

<ul>
<li>Mục 1</li>
<li>Mục 2</li>
</ul>
`}
        className="min-h-[400px] w-full resize-y border-0 p-5 font-semibold leading-8 text-[#06113C] outline-none"
      />

      {/* Preview */}
      <div className="border-t border-black/5 bg-[#FAFAFA] p-5">

        <p className="mb-4 text-sm font-black text-[#00B14F]">
          Xem trước
        </p>

        <div
          className="
            prose
            prose-neutral
            max-w-none

            prose-h2:text-[#06113C]
            prose-h2:font-black

            prose-h3:text-[#06113C]
            prose-h3:font-black

            prose-a:text-[#00B14F]

            prose-strong:text-[#06113C]
          "
          dangerouslySetInnerHTML={{
            __html: value || "<p>Chưa có nội dung.</p>",
          }}
        />
      </div>
    </div>
  );
}