import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import logo from '../../assets/logo.png';

const Footer = () => {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();
    const bgImage = `${import.meta.env.BASE_URL}assets/footer.png`;

    return (
        <footer
            className="relative mt-auto w-full py-16 px-6 overflow-hidden"
            style={{
                // 這裡不設定背景色，讓 body 的 radial-gradient 透出來
                backgroundImage: `url(${bgImage})`,
                backgroundPosition: 'bottom', // 貼齊右下角
                backgroundRepeat: 'repeat-x',
                backgroundSize: '400px auto', // 根據你的圖片大小調整寬度
                backgroundAttachment: 'scroll' // 讓圖片隨頁面滾動，與 body 的 fixed 產生層次感
            }}
        >
            {/* 加上一個極淡的漸層，讓主內容到頁尾的過渡更柔和 */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/20 -z-10" />

            <div className="relative z-10 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center gap-10">

                    {/* Logo & 描述 */}
                    <div className="flex items-center gap-3 flex-shrink-0 min-w-0">
                        <img src={logo} alt="Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
                        <div className="flex flex-col leading-none">
                            <h1 className="text-lg font-display font-black bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent truncate hidden md:block tracking-tight">
                                {t('app.title').split(' ')[0] + ' ' + t('app.title').split(' ')[1]}
                            </h1>
                            <span className="text-[10px] font-display font-bold text-journal-muted tracking-[0.2em] uppercase hidden md:block">
                                {t('app.subtitle')}
                            </span>
                        </div>
                        <p className="text-sm text-journal-muted font-medium max-w-xs text-center md:text-left leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
                            {t('footer.tagline')}
                        </p>
                    </div>

                    {/* 版權宣告 */}
                    <div className="flex flex-col items-center md:items-end gap-2">
                        <p className="text-[11px] font-bold text-journal-muted tracking-widest uppercase">
                            {t('footer.copyright', { year: currentYear })}
                        </p>
                        <p className="text-[10px] text-journal-muted/80 leading-relaxed text-center md:text-right max-w-[180px]">
                            {t('footer.disclaimer')}
                        </p>
                        <Link to="/privacy" className="text-[10px] text-journal-muted/60 hover:text-journal-muted transition-colors">
                            {t('footer.privacy')}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;