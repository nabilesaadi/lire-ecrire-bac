import json, sys, os
from pptx import Presentation
from pptx.util import Emu
src, out = sys.argv[1], sys.argv[2]
p = Presentation(src)
res = []
for i, s in enumerate(p.slides, 1):
    sh = []
    def walk(shapes):
        for x in shapes:
            if x.shape_type == 6:  # group
                walk(x.shapes); continue
            d = {'name': x.name, 'x': x.left, 'y': x.top, 'w': x.width, 'h': x.height}
            if x.has_text_frame and x.text_frame.text.strip():
                d['text'] = [pp.text for pp in x.text_frame.paragraphs if pp.text.strip()]
            if x.shape_type == 13:
                d['img'] = os.path.basename(x.image.filename) if False else x._element.blip_rId
                rel = s.part.related_part(d['img'])
                d['img'] = os.path.basename(rel.partname)
            if 'text' in d or 'img' in d:
                sh.append(d)
    walk(s.shapes)
    bg = None
    notes = s.notes_slide.notes_text_frame.text if s.has_notes_slide else ''
    res.append({'n': i, 'layout': s.slide_layout.name, 'shapes': sh, 'bg': bg, 'notes': notes})
json.dump(res, open(out, 'w'), ensure_ascii=False, indent=0)
