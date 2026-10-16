import { useRef, useState } from 'react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import { unggahGambar } from '../lib/satua'

export default function PenyuntingTeks({ nilaiAwal, onUbah }) {
  const inputGambar = useRef(null)
  const [pesan, setPesan] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: nilaiAwal,
    onUpdate: ({ editor }) => onUbah(editor.getHTML()),
  })

  const aktif = useEditorState({
    editor,
    selector: ({ editor }) => ({
      tebal: editor?.isActive('bold') ?? false,
      miring: editor?.isActive('italic') ?? false,
      kiri: editor?.isActive({ textAlign: 'left' }) ?? false,
      tengah: editor?.isActive({ textAlign: 'center' }) ?? false,
      rata: editor?.isActive({ textAlign: 'justify' }) ?? false,
    }),
  })

  async function tambahGambar(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPesan('Mengunggah gambar…')
    try {
      const url = await unggahGambar(file)
      editor.chain().focus().setImage({ src: url }).run()
      setPesan('')
    } catch (err) {
      setPesan(`Gagal mengunggah: ${err.message}`)
    }
  }

  if (!editor) return null

  return (
    <div>
      <div className="toolbar" role="toolbar" aria-label="Format teks">
        <button type="button" aria-pressed={aktif.tebal}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <strong>B</strong>
        </button>
        <button type="button" aria-pressed={aktif.miring}
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <em>I</em>
        </button>
        <button type="button" aria-pressed={aktif.kiri}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          Kiri
        </button>
        <button type="button" aria-pressed={aktif.tengah}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          Tengah
        </button>
        <button type="button" aria-pressed={aktif.rata}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
          Justify
        </button>
        <button type="button" onClick={() => inputGambar.current?.click()}>
          Gambar
        </button>
        <input ref={inputGambar} type="file" accept="image/*" hidden onChange={tambahGambar} />
      </div>
      <EditorContent editor={editor} className="editor-isi isi" />
      {pesan && <p className="redup">{pesan}</p>}
    </div>
  )
}