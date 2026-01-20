import React from 'react';
import { useNavigate } from 'react-router-dom';

const MemoryDetail: React.FC = () => {
  const navigate = useNavigate();

  // Mock data for 9-grid layout
  const images = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuARtHTKPIR97TGxNoeadol2bJAMTXhP9K6OVXysy1C_GprC-1a9EDAFk9DaWQ6CG1vWHY3hvLNPsRy3D377EMvRJvKX44HuFjo63nExBahF2XE6Cx2iFRLHX6aaEbeuh_dYH_TTwyGFt3mk7oVqmLZuPVOAm9xuVhyaSCm8S5MoRBD_pV8Qd47VVvXmOU9jkqrOzrF3Cpj4uI1YDotAk8HaSh2yUwKpDDWyRZaz6GoTO1cWzce6rKhJwuVr-0Zl9448XAXeXV1rx7uq", // Sunset
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCVikP23_Sd9YpmX9W2Pfxq3vMjfeyjaX06LadyYYWucrFukpBTd29UJSOihAYpANaqsp3uEgoB0BYRVxS6hIwU5dPkqvh9WpgyxkOnqopipxEMzeYQ7zEoZzi3ShmRmrGR8mvUIb6B-73xitGqujzr_bCvEaE0x9zk7bNf7aB9nrH_8r4sZJ12i_enCMD5TnrPwZ5-MGGZmU3-e1JKS-qiHFND-eUOzafBdB_MJtsI-HHcrSTMKRTv0UnboXIC5J_ZMi92-xTmdFIN", // Hands
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBhPCloPMwfO7rU9egZjKAWfO89-_Xl-Oh-cTLCgIJR7dNV_3WwOlbW_-gwB1fvqN3q3BGcjkSKXmyEKGyYZUq5zwY_OpOD2NXkcoX_tLDvI65l3L7ACDNJblUeNtntWlaCPu7m-Y16P_t-VMB8aGXZGt0BReUpBSIgkUgf3Sz6y7vZM-HkxbjKK0mnqeW7-tWpgygwJVQzzNek-ftH8odtuMJfD0Pm1_mj1n_h1Ym3U5rufvYLvHLxLxPSrRUCyxaMieX1SK9ywKxD", // Coffee
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA8E1niemOXc7hzOhIpvvFyfWeblX_rTMAPZmy0x6Ng6eAYt3kGfDjfTBJf4dV5MyVr1IQ_rXyb8y4EJmjRFDvxvsx94KTZ7Y4k9CK8hZFRugXYIh2rifPIVd6BobAGbo1w1FBcvWCfMJdqW5uOPR5iMkVsmnclZHiXgYGgctYexiaCSAaqIbqWhTJqKqqAP0zdJmG756-3qMarcvguJEv9WdffFef_Dg1XMc9aHfeuJvXmHX0FTZwqSsUib2ZSQbe-HhR3iZF9vhQ0", // Person 1
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDPPmNYEnXIY0FmIYZsMjrXLFcNix70Hf6mAgI4VV701fxuE75fOqJLFeBO-SFA9y2DQFyZD645jpm92RZO_d8Gpy6vkJR3CiuKTXFclwJLgDIJAXRxwGaFTa6WI19BIxPm1SgX-ZzZKsSaQ7NFRBws9IvJrtGQffSQ08qNPQBAgufdylex26Fg12sidmJrYX2Bg9giDwHgcx8qc7cq4SwHp9N2WEsobt_AeYFzu7gpbcQdTjZhRV7hDLrCbK81cO7_GFfM2UzYY5or", // Person 2
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDi_BVSbyGdh2-LTpHmC0CY2EF4wh0aQIsBApHLcvxABqytJCklk8f5GOMRenW0c1pUzI0qyC3ZLLauZ210J8bkff7qRJUZWASX8WFIMpeZA32AWV_p6I4S3H1iuRhWJWDIxnRVd7hI8tp0xk7-Zkh5IuUA8F4S_kF9b6bq05LKfsyoxEA6-EYWvgIakSFJHnKeJQVv44rHkJ9HtQrgO_7svGQ0F6v04x8OsGQAyEHoAGarJPAzn9xjV6EcTSZ5hFDd04qI05OhzC8M", // Avatar
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDKSKS0PQi3pbdwoO92niYuN_xk6CoF7Y2aRRyGHEfr3Esu9vK5gfUD8vyE2Qz8vz2mA7PXefp_m9yqZ7Rzr3iex6tqJsLPtc7GYIG_n9r637rxfU2QR6_IBmv5QXxYZctA7V4ahkfY57URjSmW5-xIeAddxSQaXhgMR1V99JEvTc7LZfZWmzmOzky0t8pVRW3PKOwa3a6trLFoc9R-usHQBYZxQNAVTyaOuvgVJQrkEUjKAjetRLFbGW79NBsa3aaSqlqneGs4pDN", // Avatar
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCvUWGjC3H82Dmoy0EAd2ipPiGbRYTnIk388mUCRCUwIiDYUMwenrQ7mgEtf_0gQV6PxluOYhcdBDIrgIRWyTZ283UAXuBhQ8p91CJFuC56iDj7okF7YKIe3WRy7eTWXmxWpWqV7o59idmFt21TPBcJ0z8mjKpW_jOEOyRb7HcEMHwtwvWUfSzRPtZQtnqTJib0j28BHPYZF_lVEb4zQu64NcNPJzMGTKuPGEApXkWA24VTgK-CTerTMUo-lLiL9xi-jCKUFWdIy4SV", // Cat
    "https://lh3.googleusercontent.com/aida-public/AB6AXuC30MsYoNnpEvZsEOP7boz3-OEgWm_8bqG9pKoYD8ZhDpDGV_hjzEkrVmvNkIdIGWifjYPLwK1nWZh8nQTCysRbXCuZVo_-zCjxj2T0YidV92XUCLw6uy-YA7uBmHKzO37CQy8BBHTJbuF2TjFOm984llNGnZkF-yjwffitsV8BYgNUudfWbwy3U-T7jtMxZM6bms9druPx8baOtjjZDKvDGiN_TbVWqygKWhzq58crJqNZsPmQ9nEFCOzAYalxwWYOW1MZITV4l-Sy" // Beach
  ];

  return (
    <div className="flex-1 flex flex-col bg-background-light min-h-screen relative">
       {/* Header */}
       <div className="sticky top-0 z-20 px-4 py-3 flex justify-between items-center bg-background-light/95 backdrop-blur-md border-b border-black/[0.03]">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors">
             <span className="material-symbols-outlined text-ink">arrow_back</span>
          </button>
          <span className="text-sm font-bold uppercase tracking-widest text-ink/60">Memory</span>
          <button className="p-2 -mr-2 hover:bg-black/5 rounded-full transition-colors">
             <span className="material-symbols-outlined text-ink">more_horiz</span>
          </button>
       </div>

       <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
          <div className="px-6 py-6">
             {/* Header Info */}
             <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col">
                   <h1 className="font-serif text-2xl text-ink font-bold leading-tight mb-2">Sunset at the Beach</h1>
                   <div className="flex items-center gap-2 text-soft-gray/80 text-[11px] font-bold uppercase tracking-widest">
                      <span>Oct 24, 2023</span>
                      <span className="w-1 h-1 rounded-full bg-current"></span>
                      <span>Day 127</span>
                   </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-paper flex items-center justify-center text-accent shadow-sm border border-primary/20">
                   <span className="material-symbols-outlined text-xl" style={{fontVariationSettings: "'FILL' 1"}}>sentiment_very_satisfied</span>
                </div>
             </div>

             {/* Text Content */}
             <div className="prose prose-p:text-ink/80 prose-headings:font-serif mb-8">
                <p className="font-sans text-base leading-relaxed text-[#4A2B2B]">
                   A beautiful evening spent watching the waves. We talked about our future home for hours, imagining a small cottage by the sea with a garden full of hydrangeas.
                   <br/><br/>
                   The sky turned into this incredible shade of purple and orange. I never want to forget how peaceful you looked staring at the horizon.
                </p>
             </div>

             {/* 9-Grid Images */}
             <div className="grid grid-cols-3 gap-1.5 mb-8 rounded-2xl overflow-hidden">
                {images.map((img, index) => (
                  <div key={index} className="aspect-square relative group overflow-hidden bg-gray-100 cursor-pointer">
                    <img 
                      src={img} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      alt={`Memory ${index + 1}`} 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                  </div>
                ))}
             </div>

             {/* Meta Tags */}
             <div className="flex gap-2 flex-wrap mb-8">
                 <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-primary/10 shadow-sm">
                    <span className="material-symbols-outlined text-[16px] text-soft-gray">location_on</span>
                    <span className="text-[10px] font-bold text-soft-gray uppercase tracking-wide">Malibu, CA</span>
                 </div>
                 <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-primary/10 shadow-sm">
                    <span className="material-symbols-outlined text-[16px] text-soft-gray">sell</span>
                    <span className="text-[10px] font-bold text-soft-gray uppercase tracking-wide">Date Night</span>
                 </div>
             </div>

             {/* Reactions / Comments placeholder */}
             <div className="border-t border-black/[0.05] pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full border-2 border-background-light bg-gray-200 bg-cover bg-center" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA8E1niemOXc7hzOhIpvvFyfWeblX_rTMAPZmy0x6Ng6eAYt3kGfDjfTBJf4dV5MyVr1IQ_rXyb8y4EJmjRFDvxvsx94KTZ7Y4k9CK8hZFRugXYIh2rifPIVd6BobAGbo1w1FBcvWCfMJdqW5uOPR5iMkVsmnclZHiXgYGgctYexiaCSAaqIbqWhTJqKqqAP0zdJmG756-3qMarcvguJEv9WdffFef_Dg1XMc9aHfeuJvXmHX0FTZwqSsUib2ZSQbe-HhR3iZF9vhQ0")'}}></div>
                    <div className="w-8 h-8 rounded-full border-2 border-background-light bg-gray-200 bg-cover bg-center flex items-center justify-center bg-primary/20 text-accent text-[10px] font-bold">+1</div>
                  </div>
                  <span className="text-xs text-ink/40 font-medium">Liked by Alex and You</span>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-black/[0.03] shadow-sm space-y-3">
                   <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-gray-200 bg-cover bg-center mt-1" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA8E1niemOXc7hzOhIpvvFyfWeblX_rTMAPZmy0x6Ng6eAYt3kGfDjfTBJf4dV5MyVr1IQ_rXyb8y4EJmjRFDvxvsx94KTZ7Y4k9CK8hZFRugXYIh2rifPIVd6BobAGbo1w1FBcvWCfMJdqW5uOPR5iMkVsmnclZHiXgYGgctYexiaCSAaqIbqWhTJqKqqAP0zdJmG756-3qMarcvguJEv9WdffFef_Dg1XMc9aHfeuJvXmHX0FTZwqSsUib2ZSQbe-HhR3iZF9vhQ0")'}}></div>
                      <div className="flex-1">
                        <p className="text-xs text-ink/80 leading-relaxed"><span className="font-bold text-ink mr-1">Alex</span>Can't believe this was already 4 months ago! ❤️</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
       </main>

       {/* Floating Action / Edit */}
       <div className="absolute bottom-6 right-6 z-30">
          <button className="w-14 h-14 bg-primary text-ink rounded-full shadow-glow flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
             <span className="material-symbols-outlined text-2xl">edit</span>
          </button>
       </div>
    </div>
  );
};

export default MemoryDetail;