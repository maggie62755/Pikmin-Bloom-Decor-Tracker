
import React from 'react';

const PrivacyPolicy = () => {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl text-nature-earth">
            <h1 className="text-3xl font-bold mb-6 text-brand-primary">隱私權條款</h1>

            <div className="space-y-6 bg-white/50 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-brand-primary/10">
                <section>
                    <h2 className="text-xl font-semibold mb-3 text-brand-secondary">1. 簡介</h2>
                    <p className="leading-relaxed">
                        Pikmin Bloom Decor Tracker（以下簡稱「本應用程式」）致力於保護您的隱私。本隱私權條款旨在說明我們如何處理您的資料，特別是關於 Google API 的使用。
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-brand-secondary">2. 資料收集與使用</h2>
                    <p className="leading-relaxed mb-2">
                        本應用程式是一個純前端的網頁應用程式 (Client-side application)。我們<strong>不會</strong>在我們的伺服器上收集、儲存或分享您的任何個人資料。
                    </p>
                    <p className="leading-relaxed">
                        所有的資料處理皆在您的瀏覽器中進行。
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-brand-secondary">3. Google API 的使用</h2>
                    <p className="leading-relaxed mb-2">
                        本應用程式使用 Google Sheets API 來提供資料備份與同步的功能。當您選擇登入 Google 帳號並授權本應用程式存取您的 Google Sheets 時：
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>存取權限：</strong>我們僅會要求存取您指定的試算表權限，用於讀取和寫入您的 Pikmin 飾品收集紀錄。</li>
                        <li><strong>資料傳輸：</strong>資料僅會在您的瀏覽器與 Google 伺服器之間直接傳輸。我們無法查看、攔截或儲存您的登入憑證或資料。</li>
                        <li><strong>資料用途：</strong>此權限僅用於將您的收集進度儲存到您個人的 Google 試算表中，以便您在不同裝置間同步資料。</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-brand-secondary">4. 資料儲存</h2>
                    <p className="leading-relaxed">
                        除上述 Google Sheets 同步功能外，本應用程式會將您的收集進度儲存在您瀏覽器的 LocalStorage（本機儲存空間）中。您可以隨時清除瀏覽器快取來刪除這些資料。
                    </p>

                </section>

                <section className="bg-brand-primary/5 p-4 rounded-xl border-l-4 border-brand-primary">
                    <h2 className="text-xl font-semibold mb-3 text-brand-secondary">Google 資料合規聲明</h2>
                    <p className="text-sm leading-relaxed mb-2">
                        本應用程式對從 Google API 接收到的資訊的使用與傳輸，將嚴格遵守 <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" className="underline">Google API Services User Data Policy</a>。
                    </p>
                    <p className="text-sm leading-relaxed">
                        我們承諾：<strong>不將資料用於廣告投遞、不轉售資料給第三方、不將資料用於信用評估或任何與本工具功能無關之用途。</strong>
                    </p>

                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-brand-secondary">5. 如何撤銷授權</h2>
                    <p className="leading-relaxed">
                        您可以隨時透過本應用程式的『登出』功能斷開連結，或是前往 <strong>Google 帳號安全性設定</strong> 撤銷對本應用程式的存取權限。
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-brand-secondary">6. 第三方服務</h2>
                    <p className="leading-relaxed">
                        本應用程式託管於 GitHub Pages。GitHub 可能會收集伺服器日誌（例如 IP 位址），以維護服務的安全性和穩定性。請參閱 <a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">GitHub 隱私權聲明</a> 以了解更多資訊。
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-brand-secondary">7. 條款變更</h2>
                    <p className="leading-relaxed">
                        我們可能會不時更新本隱私權條款。更新後的條款將公佈於此頁面。
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-brand-secondary">8. 聯絡我們</h2>
                    <p className="leading-relaxed">
                        如果您對本隱私權條款有任何疑問，請透過 <a href="https://github.com/maggie62755/Pikmin-Bloom-Decor-Tracker" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">Pikmin Bloom Decor Tracker GitHub Repository</a> 提交 Issue 與我們聯繫。
                    </p>
                </section>

                <div className="pt-4 text-sm text-gray-500 border-t border-gray-200 mt-8">
                    最後更新日期：{new Date().toLocaleDateString()}
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
