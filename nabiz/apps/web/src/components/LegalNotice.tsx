/**
 * Yasal metinlerin başına konan uyarı.
 *
 * Bu metinler mühendislik tarafından, ürünün gerçek veri davranışına bakılarak yazıldı;
 * hukuki inceleme yerine geçmez. Launch öncesi avukat kontrolü `docs/18` kapsamındadır
 * ve bu uyarı ancak o kontrol tamamlandığında kaldırılmalıdır.
 */
export function LegalNotice() {
  return (
    <p className="meta" style={{ color: '#f79009' }}>
      ⚠ Taslak metin — yayına çıkmadan önce hukuki inceleme yapılmalıdır.
    </p>
  );
}
