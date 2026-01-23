import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';

const Footer = () => {
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
                            <h1 className="text-lg font-black bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent truncate hidden md:block tracking-tight">
                                Pikmin Bloom
                            </h1>
                            <span className="text-[10px] font-bold text-stone-400 tracking-[0.2em] uppercase hidden md:block">
                                Decor Tracker
                            </span>
                        </div>
                        <p className="text-sm text-stone-500 font-medium max-w-xs text-center md:text-left leading-relaxed">
                            記錄你的皮克敏探險進度，<br />讓每一朵花都在你的圖鑑中綻放。
                        </p>
                    </div>

                    {/* 快速連結：使用稍微深一點的顏色確保在淺色漸變上清晰 */}
                    {/* <div className="flex gap-16">
                        <div className="flex flex-col gap-4">
                            <span className="text-[11px] font-black text-stone-400 uppercase tracking-[0.2em]">Explore</span>
                            <Link to="/" className="text-sm font-bold text-stone-600 hover:text-green-600 transition-all">首頁</Link>
                            <Link to="/tracker" className="text-sm font-bold text-stone-600 hover:text-green-600 transition-all">收集器</Link>
                            <Link to="/dashboard" className="text-sm font-bold text-stone-600 hover:text-green-600 transition-all">儀表板</Link>
                        </div>
                        <div className="flex flex-col gap-4">
                            <span className="text-[11px] font-black text-stone-400 uppercase tracking-[0.2em]">Community</span>
                            <a href="#" className="text-sm font-bold text-stone-600 hover:text-green-600 transition-all">Twitter</a>
                            <a href="#" className="text-sm font-bold text-stone-600 hover:text-green-600 transition-all">Discord</a>
                        </div>
                    </div> */}

                    {/* 版權宣告 */}
                    <div className="flex flex-col items-center md:items-end gap-2">
                        <p className="text-[11px] font-bold text-stone-400 tracking-widest uppercase">
                            © {currentYear} Pikmin Fan Project
                        </p>
                        <p className="text-[10px] text-stone-400/80 leading-relaxed text-center md:text-right max-w-[180px]">
                            This is a fan-made tool. Pikmin is a trademark of Nintendo.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;