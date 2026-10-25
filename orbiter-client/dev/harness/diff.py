# Percent of pixels differing (>16/255) between baseline screens and another capture: diff.py <dir>
import glob, os, sys
from PIL import Image, ImageChops
base = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../../docs/baseline')
for f in sorted(glob.glob(base + '/[0-1]*.png')):
    name = os.path.basename(f)
    other = os.path.join(sys.argv[1], name)
    if not os.path.exists(other):
        print(f'{name:30s} missing'); continue
    a = Image.open(f).convert('RGB'); b = Image.open(other).convert('RGB')
    h = ImageChops.difference(a, b).convert('L').histogram()
    print(f'{name:30s} {sum(h[16:]) / (a.size[0] * a.size[1]) * 100:5.1f}%')
