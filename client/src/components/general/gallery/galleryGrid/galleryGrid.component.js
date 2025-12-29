import React, { useState } from 'react';
import {
  Box,
  Container,
  ImageList,
  ImageListItem,
  Typography,
  Pagination,
  useTheme,
} from '@mui/material';
import ImageModal from '../imageModal/imageModal.component';

const Gallery = ({ imagesPerPage = 6 }) => {
  const theme = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [zoomStyles, setZoomStyles] = useState({ transform: 'scale(1)', transformOrigin: 'center' });



  const images = [
    { src: 'https://scontent-dfw5-2.xx.fbcdn.net/v/t39.30808-6/469380675_28188703160720820_813692779570680960_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=833d8c&_nc_ohc=w5TZ-DhYck0Q7kNvgH1cR1L&_nc_zt=23&_nc_ht=scontent-dfw5-2.xx&_nc_gid=A7duUoHqTERH1xjDnOlU0zp&oh=00_AYAb8L5VUNHF5CpHaxH4eHQ7BOT0XtMnOfKSMJPndZUxsQ&oe=67599EF8', alt: 'Description of Image 1' },
    { src: 'https://scontent-dfw5-2.xx.fbcdn.net/v/t39.30808-6/469089325_28188706467387156_183821728395902388_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=106&ccb=1-7&_nc_sid=833d8c&_nc_ohc=V_a8MPaS7xsQ7kNvgEeDdFC&_nc_zt=23&_nc_ht=scontent-dfw5-2.xx&_nc_gid=AdZ0S9pIvrDOfXQmpyd6Icg&oh=00_AYD3TUT5Qq5Kz-Kv9VsuaOh77qUsLna3BlGYP_tmBAh-zw&oe=67599623', alt: 'Description of Image 2' },
    { src: 'https://scontent-dfw5-2.xx.fbcdn.net/v/t39.30808-6/469380336_28188707300720406_6929424478153245135_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=100&ccb=1-7&_nc_sid=833d8c&_nc_ohc=_jdSxlBohEkQ7kNvgEdeO5S&_nc_zt=23&_nc_ht=scontent-dfw5-2.xx&_nc_gid=AWFk-E85mQvbNNqlhfF09-G&oh=00_AYBzAlHqpydRotKRpo3MMwnSHXwL2Z_uxtrnToODuFvXTw&oe=67599864', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-2.xx.fbcdn.net/v/t39.30808-6/469280187_28188708267386976_5144516411397712364_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=107&ccb=1-7&_nc_sid=833d8c&_nc_ohc=Nba8auUddQsQ7kNvgHT3fOu&_nc_zt=23&_nc_ht=scontent-dfw5-2.xx&_nc_gid=AddgdedJ9_F6182jBArEolF&oh=00_AYASruU8-i-h15CkQJUzS-5aujoYA1V-wJhsC9ZI-CXU7g&oe=6759911F', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-1.xx.fbcdn.net/v/t39.30808-6/469357380_28188710284053441_1894950616955531250_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=105&ccb=1-7&_nc_sid=833d8c&_nc_ohc=2k-s1Dqs0-EQ7kNvgFa6ZdW&_nc_zt=23&_nc_ht=scontent-dfw5-1.xx&_nc_gid=ARNvgn_YHwdbG-cNwG4lNar&oh=00_AYDqgptBRYassO2wrSuWhWsKQP9jNGeKrkIyqaWfLLE-Qw&oe=67599E65', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-1.xx.fbcdn.net/v/t39.30808-6/469049184_28188705914053878_179611177447907828_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=111&ccb=1-7&_nc_sid=833d8c&_nc_ohc=VZIKpBxZ8pUQ7kNvgHCOyDD&_nc_zt=23&_nc_ht=scontent-dfw5-1.xx&_nc_gid=AKEXINHV33KWWwE-A-bORYa&oh=00_AYAsFEmTTg4iuhLSeYW6QZ8dZB1mAuLo-ycp1CxbJzglfw&oe=67598FC3', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-2.xx.fbcdn.net/v/t39.30808-6/469178031_28188709547386848_8801661793017673455_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=108&ccb=1-7&_nc_sid=833d8c&_nc_ohc=LBWCb8rlCIMQ7kNvgHBta40&_nc_zt=23&_nc_ht=scontent-dfw5-2.xx&_nc_gid=AW46pHKyvZo6WTES2Cvz98x&oh=00_AYDFY2jIb24S-YBKd1qDcxIK_EBKzbgWrrS148vjT8bt6w&oe=6759AF8C', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-1.xx.fbcdn.net/v/t39.30808-6/469149023_28188704527387350_7417680190704527806_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=101&ccb=1-7&_nc_sid=833d8c&_nc_ohc=07BJkQGdaLgQ7kNvgGfqKyp&_nc_zt=23&_nc_ht=scontent-dfw5-1.xx&_nc_gid=A1bDKzlI1o1qly270yh41CA&oh=00_AYA-eSZM0G_WoLhyrB-tbrouU2iqftyrX_p7Bct6Zw664A&oe=6759B206', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-2.xx.fbcdn.net/v/t39.30808-6/469089469_28188707627387040_8956603865800935137_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=100&ccb=1-7&_nc_sid=833d8c&_nc_ohc=YfPHN8GVdFAQ7kNvgGmhpl6&_nc_zt=23&_nc_ht=scontent-dfw5-2.xx&_nc_gid=A4zKzajQkgpQ0gKV12pNDP_&oh=00_AYBUxOMMQ3RygiINoP3X_TK3d268Ke-VqPzhpsQNZBNUCg&oe=6759A492', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-1.xx.fbcdn.net/v/t39.30808-6/469268999_28188709887386814_2238388430559691959_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=109&ccb=1-7&_nc_sid=833d8c&_nc_ohc=0v8cKoiDNXMQ7kNvgHo03kY&_nc_zt=23&_nc_ht=scontent-dfw5-1.xx&_nc_gid=AwMbJqjR6pVNw1mIFEzFttY&oh=00_AYAtPkFdvHN34mNagePyJ12RaPUlxPJBu9nt6fmumou7YQ&oe=67599C77', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-1.xx.fbcdn.net/v/t39.30808-6/469306194_28188708620720274_4416896638253161751_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=109&ccb=1-7&_nc_sid=833d8c&_nc_ohc=0OSBnE852HQQ7kNvgGf4fqa&_nc_zt=23&_nc_ht=scontent-dfw5-1.xx&_nc_gid=ACk5TrJt32OWtXg3RZIudXl&oh=00_AYDO5ILiFD6baEVPRfUt3DhGnVHpZTedm3reff8nF7h6Qw&oe=6759B112', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-1.xx.fbcdn.net/v/t39.30808-6/469120123_28188708114053658_5574468680065105285_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=110&ccb=1-7&_nc_sid=833d8c&_nc_ohc=Q5f12F_yS84Q7kNvgF6IGjM&_nc_zt=23&_nc_ht=scontent-dfw5-1.xx&_nc_gid=ALHQEiToVLKYyUhXfH5ygdt&oh=00_AYB-b2o55Ce6f8cKuYcRNHV2gPaT46gYfvZi1tAIwivo2g&oe=6759B7B9', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-1.xx.fbcdn.net/v/t39.30808-6/469311875_28188704130720723_5647012431539477275_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=111&ccb=1-7&_nc_sid=833d8c&_nc_ohc=xn-lvx3XvqQQ7kNvgEZAbWN&_nc_zt=23&_nc_ht=scontent-dfw5-1.xx&_nc_gid=AdtlhiTmizUVmTC8zJWiyXa&oh=00_AYA4bxGombNktbAuEEuv0HZOrRLQYIXEoZ1JK1wHON-JfA&oe=675987CC', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-1.xx.fbcdn.net/v/t39.30808-6/469297829_28188707124053757_8049685378430011242_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=101&ccb=1-7&_nc_sid=833d8c&_nc_ohc=aRPhb_dh7UcQ7kNvgF1bzSG&_nc_zt=23&_nc_ht=scontent-dfw5-1.xx&_nc_gid=AG7IIf0opc6rsS17LVJ1CH1&oh=00_AYCSWwU2lBND7fHNLEqhe7xcZAIcVfcHHt60fwuGN51lhg&oe=67599587', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-2.xx.fbcdn.net/v/t39.30808-6/469047586_28188705507387252_2654714012818972490_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=108&ccb=1-7&_nc_sid=833d8c&_nc_ohc=NbPauO5C570Q7kNvgHcoYT4&_nc_zt=23&_nc_ht=scontent-dfw5-2.xx&_nc_gid=Ag-XQNbbPPeJ_LnROxM0Bvt&oh=00_AYDDtUleYrkOd-Uzqlr4usQ0ibMztQoaXXK0IzshFhBhJg&oe=6759B15F', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-1.xx.fbcdn.net/v/t39.30808-6/469158457_28188704754053994_2835299070176726437_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=110&ccb=1-7&_nc_sid=833d8c&_nc_ohc=7s5qHLPKNaMQ7kNvgFU8wqS&_nc_zt=23&_nc_ht=scontent-dfw5-1.xx&_nc_gid=AZUb_TGXzFRVj6mgHgnyfuf&oh=00_AYASN3wEL7W86ZzxDvVn5LVE5K6KUyMdDw4LbQEDlkK8Xg&oe=6759B7D3', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-2.xx.fbcdn.net/v/t39.30808-6/469159704_28188705180720618_5146512628873676578_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=108&ccb=1-7&_nc_sid=833d8c&_nc_ohc=x-w5-CELkVkQ7kNvgFfJh9n&_nc_zt=23&_nc_ht=scontent-dfw5-2.xx&_nc_gid=A9918vWOZkZjkJDuvdvRmqw&oh=00_AYC0sZWBVHciVSvhfwVwyUXMdssyZGqqtEmBaMHazTVOEw&oe=6759A684', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-2.xx.fbcdn.net/v/t39.30808-6/469166499_28188709254053544_6421139987574586182_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=106&ccb=1-7&_nc_sid=833d8c&_nc_ohc=3TtmKrQZ578Q7kNvgEvXSsP&_nc_zt=23&_nc_ht=scontent-dfw5-2.xx&_nc_gid=A0Epi1MmVawOAssgHJONkn_&oh=00_AYDV66Yuiw4aSPpdb6bM78N8mZ_NYIPvrrqBywUOOHtSQg&oe=6759BDF3', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-2.xx.fbcdn.net/v/t39.30808-6/469103918_28188710457386757_2271161946685300840_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=108&ccb=1-7&_nc_sid=833d8c&_nc_ohc=mk1SA4np_fgQ7kNvgFQf_iJ&_nc_zt=23&_nc_ht=scontent-dfw5-2.xx&_nc_gid=AWZCIc_L9BaN0I4D46HdOMx&oh=00_AYBbECloA2pC9Hten2VkY0i_PZRVfLQfK8xg24Ob34T_sw&oe=67599D08', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-1.xx.fbcdn.net/v/t39.30808-6/469380421_28188709410720195_6554950470658729692_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=110&ccb=1-7&_nc_sid=833d8c&_nc_ohc=MuVfsI_yzXYQ7kNvgGKbOwf&_nc_zt=23&_nc_ht=scontent-dfw5-1.xx&_nc_gid=Azut1eLOZZzLvuXJr8fAP21&oh=00_AYAi6wXONiUh0X0ZvtL5HMw-4ZkWAj2ckWfsPB5Zf-43vg&oe=6759A3FA', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-1.xx.fbcdn.net/v/t39.30808-6/469338818_28188710624053407_6269680622679203035_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=111&ccb=1-7&_nc_sid=833d8c&_nc_ohc=jDcz6g3njiUQ7kNvgFeAo5v&_nc_zt=23&_nc_ht=scontent-dfw5-1.xx&_nc_gid=ASkXtzoO-oafcUjlI2hdr3d&oh=00_AYCgI3uBINOqh9hq6eZrXbIsZFO3YxBjI536CN6VkxlvJg&oe=67598E92', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-1.xx.fbcdn.net/v/t39.30808-6/469275780_28188708917386911_1197259886861459884_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=103&ccb=1-7&_nc_sid=833d8c&_nc_ohc=blzVkCszkMgQ7kNvgEn6I31&_nc_zt=23&_nc_ht=scontent-dfw5-1.xx&_nc_gid=ApsbB5VZOLkb33rtYYt9O6O&oh=00_AYBXW3xmWzGsVMAG9GliIgzHq4-OCN9DuIj7cZzj_IyT1g&oe=67599E71', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-1.xx.fbcdn.net/v/t39.30808-6/469196011_28188706437387159_8444387549564104334_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=833d8c&_nc_ohc=zkTMqMzXyGsQ7kNvgHlcC9w&_nc_zt=23&_nc_ht=scontent-dfw5-1.xx&_nc_gid=API-zc_6BHOiB2bD1wGX_UH&oh=00_AYCYFhNQq-2i6zt8BmYw5mJh2PTNXYT4f0GN6IZXZ1Hj9A&oe=6759A8BA', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-2.xx.fbcdn.net/v/t39.30808-6/469048678_28188707474053722_2018418696310859872_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=100&ccb=1-7&_nc_sid=833d8c&_nc_ohc=WZucdMLi0MQQ7kNvgEBCzzr&_nc_zt=23&_nc_ht=scontent-dfw5-2.xx&_nc_gid=ABUrVAcakMz8sLe1coGRoul&oh=00_AYDok9txCuMeYU3TR_s2NZub1Lnc31LfLPjh4qr_bfrQVQ&oe=6759B366', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-1.xx.fbcdn.net/v/t39.30808-6/469258115_28188704340720702_4901607521655387439_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=105&ccb=1-7&_nc_sid=833d8c&_nc_ohc=UyNZoa0ptDEQ7kNvgG5p2KB&_nc_zt=23&_nc_ht=scontent-dfw5-1.xx&_nc_gid=AjngmRXQlFwXj0Ig0TjxzlY&oh=00_AYDKmnr6xE6KRkNsdbn8-rNzkT93ZGF-RdRKXeQU-TnCaQ&oe=6759B1B2', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-1.xx.fbcdn.net/v/t39.30808-6/469280572_28188704954053974_1511540534583894409_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=101&ccb=1-7&_nc_sid=833d8c&_nc_ohc=sDCAKW2mfDkQ7kNvgGXJz66&_nc_zt=23&_nc_ht=scontent-dfw5-1.xx&_nc_gid=AIDzWQMlAcOvKvpcYR5kLEd&oh=00_AYBKgxAJeRIckjuLxP1XoRmx5wxtgxFDwgYzpssIJy5R8g&oe=67599EC5', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-1.xx.fbcdn.net/v/t39.30808-6/469356167_28188703447387458_6835335506790722022_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=833d8c&_nc_ohc=LmeQIyhAcIkQ7kNvgEvyS2A&_nc_zt=23&_nc_ht=scontent-dfw5-1.xx&_nc_gid=AxdvfFkwf02DgPgVm-KtKML&oh=00_AYAcONwWMSBxzlf9q25UetMwuYy7w4LzdECIThdBPe9iCQ&oe=6759BC1D', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-1.xx.fbcdn.net/v/t39.30808-6/469102256_28188709120720224_6474491481349824555_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=110&ccb=1-7&_nc_sid=833d8c&_nc_ohc=wcixm8yI9xkQ7kNvgE_64bC&_nc_zt=23&_nc_ht=scontent-dfw5-1.xx&_nc_gid=Aaig8yE6owkHj2BP5j9zzQo&oh=00_AYB7B2owUcPyOF_CXyuTP03jcfXaUAW9sG0-ju5VYH_3nw&oe=6759A1B9', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-2.xx.fbcdn.net/v/t39.30808-6/469150154_28188706937387109_5402604181139968892_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=102&ccb=1-7&_nc_sid=833d8c&_nc_ohc=xFbn4n20ww0Q7kNvgHSto9d&_nc_zt=23&_nc_ht=scontent-dfw5-2.xx&_nc_gid=AjB8_srbBkD8b3Y4uU4Fq7Y&oh=00_AYBiGhEF1mkK179mbhX2_Kb2xJj1EfUFEn_5roxP4z9Oww&oe=6759B8AB', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-1.xx.fbcdn.net/v/t39.30808-6/469005922_28188709734053496_740686463905571079_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=110&ccb=1-7&_nc_sid=833d8c&_nc_ohc=FmpnjZWb74sQ7kNvgGYGEfZ&_nc_zt=23&_nc_ht=scontent-dfw5-1.xx&_nc_gid=AWW0Sj0IIfi6R3-mGfmbGc6&oh=00_AYDVRVAZBWzmwdn-P4Hug3512EqyVYw2I-mP6wz_dQXPOw&oe=6759991E', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-2.xx.fbcdn.net/v/t39.30808-6/469341168_28188703604054109_912697763307193763_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=102&ccb=1-7&_nc_sid=833d8c&_nc_ohc=k32MJjlcoyYQ7kNvgGuCtUv&_nc_zt=23&_nc_ht=scontent-dfw5-2.xx&_nc_gid=AI9SZ6-GlqSRrCaQNA8N7NQ&oh=00_AYDyfl4twSp8kozN29cuEeDGD64TqT7sVGv-S2sTzsAhnA&oe=6759B2D8', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-2.xx.fbcdn.net/v/t39.30808-6/469103893_28188710064053463_630014287590636110_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=100&ccb=1-7&_nc_sid=833d8c&_nc_ohc=mh002NimbdwQ7kNvgHl0MmY&_nc_zt=23&_nc_ht=scontent-dfw5-2.xx&_nc_gid=A2yYt4eHuZNcvEyp-OTH7HQ&oh=00_AYCi11ZM1PfIvAUXd2VnhrAkb-I0kZgGrM6pMRUy9Qi5RA&oe=67599008', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-1.xx.fbcdn.net/v/t39.30808-6/469357375_28188706124053857_3935258483367438280_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=110&ccb=1-7&_nc_sid=833d8c&_nc_ohc=rLNKVKz2-xYQ7kNvgFeI8pl&_nc_zt=23&_nc_ht=scontent-dfw5-1.xx&_nc_gid=AZx70OK6ExtUN0Tdw2URd1F&oh=00_AYD8QHmk__XYMlGsyl9hCYguUjxcbhwWmXsfxSRbnoXdgA&oe=6759A569', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-1.xx.fbcdn.net/v/t39.30808-6/469118392_28188706754053794_3668362886852809296_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=101&ccb=1-7&_nc_sid=833d8c&_nc_ohc=YxOLjpwlyd0Q7kNvgGknp_u&_nc_zt=23&_nc_ht=scontent-dfw5-1.xx&_nc_gid=AKhR915oxg5SgtE5baXLSCR&oh=00_AYB31zeb9mCF1MiCT2PDcCfkXMch-yX9KgH8sAwPitgN0Q&oe=6759970A', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-1.xx.fbcdn.net/v/t39.30808-6/469350221_28188705374053932_5193924229003320995_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=101&ccb=1-7&_nc_sid=833d8c&_nc_ohc=9OjYTlZQEJQQ7kNvgE7uK2W&_nc_zt=23&_nc_ht=scontent-dfw5-1.xx&_nc_gid=AAbeR_ZPYxkV1ory2qYSI3p&oh=00_AYAf4pGgvISQGGTzcZ92K80V3AylsCKzWwRllrFX5nQD9Q&oe=6759A95C', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-2.xx.fbcdn.net/v/t39.30808-6/469158541_28188703804054089_5723728556188408097_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=104&ccb=1-7&_nc_sid=833d8c&_nc_ohc=RTrIcfuHxCkQ7kNvgEMBkuK&_nc_zt=23&_nc_ht=scontent-dfw5-2.xx&_nc_gid=AyRSZMyoE3flZdtT88RCD5D&oh=00_AYDAqcGsoUJwcqMZGZ--HgYENMUNISoSMMudKVPqGZS1ZA&oe=6759B5EF', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-2.xx.fbcdn.net/v/t39.30808-6/469090177_28188708464053623_3731370185442463884_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=104&ccb=1-7&_nc_sid=833d8c&_nc_ohc=-OoE0zexN3IQ7kNvgE1CfZf&_nc_zt=23&_nc_ht=scontent-dfw5-2.xx&_nc_gid=APLL6anB8ta2UtQRNOwUhSZ&oh=00_AYAgQ2TCIC0NazRoIMmlnuHqOFmx4T_fAOZonVvVtg8DoA&oe=67599F08', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-1.xx.fbcdn.net/v/t39.30808-6/469098788_28188707894053680_208989334220747293_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=103&ccb=1-7&_nc_sid=833d8c&_nc_ohc=sKAV3vvL4ZgQ7kNvgGjNh-N&_nc_zt=23&_nc_ht=scontent-dfw5-1.xx&_nc_gid=Am6Kkt066-Mclu6JpmIORlv&oh=00_AYBHzF6lwySbtCu2iTe1WsdcMfrtymMHO_0eLdfbktMB6Q&oe=6759B7E6', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-2.xx.fbcdn.net/v/t39.30808-6/469375462_28188708750720261_5835749878871626693_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=107&ccb=1-7&_nc_sid=833d8c&_nc_ohc=2J3gzaySA1YQ7kNvgGPoKo7&_nc_zt=23&_nc_ht=scontent-dfw5-2.xx&_nc_gid=AN8uAOMEUirzSUzPuLqS3rN&oh=00_AYCog9PsYRkwha9uho6qLjowWgbwPgRB-NDawkwjPlDoeQ&oe=6759878A', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-1.xx.fbcdn.net/v/t39.30808-6/468961356_28188705754053894_7677992452315535586_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=110&ccb=1-7&_nc_sid=833d8c&_nc_ohc=G3GiD-M5xksQ7kNvgFttNfO&_nc_zt=23&_nc_ht=scontent-dfw5-1.xx&_nc_gid=ANfJAmQrkYRaIEgklj1aZtU&oh=00_AYCbcj5djwNVdl6I02e3afb-1BcNnlG6pVGXe1RiMr8PIQ&oe=67599107', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-1.xx.fbcdn.net/v/t39.30808-6/469395938_28188706307387172_5169697461061652750_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=101&ccb=1-7&_nc_sid=833d8c&_nc_ohc=ZTb65hEDQ6gQ7kNvgGqK8mJ&_nc_zt=23&_nc_ht=scontent-dfw5-1.xx&_nc_gid=A-FqY8UejZGo0I3nq1m7eiy&oh=00_AYBrWN-WuGeolgzHXsYaV-CQl0smBk5cc05J9_EA-UjB3Q&oe=6759B67E', alt: 'Description of Image 3' },
    { src: 'https://scontent-dfw5-1.xx.fbcdn.net/v/t39.30808-6/469141847_28188703864054083_9067977154775164632_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=833d8c&_nc_ohc=lclioMWlPDgQ7kNvgFggnO-&_nc_zt=23&_nc_ht=scontent-dfw5-1.xx&_nc_gid=AKvdXPZcE-tg2UxnX5qaT8Y&oh=00_AYBzBp5wxI4T-p4kxxKjetsyssJmPxg3qNBtHXIYYD0EnQ&oe=6759B163', alt: 'Description of Image 3' },
    
    // Add more images here
  ];

  const totalPages = Math.ceil(images.length / imagesPerPage);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setZoomStyles({ transform: 'scale(1)', transformOrigin: 'center' });
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const handleMouseMove = (event) => {
    if (!selectedImage) return;
    const { clientX, clientY, target } = event;
    const { left, top, width, height } = target.getBoundingClientRect();

    const x = ((clientX - left) / width) * 100;
    const y = ((clientY - top) / height) * 100;

    setZoomStyles({
      transform: 'scale(2)',
      transformOrigin: `${x}% ${y}%`,
    });
  };

  const handleTouchMove = (event) => {
    if (!selectedImage || !event.touches.length) return;
    const { clientX, clientY, target } = event.touches[0];
    const { left, top, width, height } = target.getBoundingClientRect();

    const x = ((clientX - left) / width) * 100;
    const y = ((clientY - top) / height) * 100;

    setZoomStyles({
      transform: 'scale(2)',
      transformOrigin: `${x}% ${y}%`,
    });
  };

  const startIndex = (currentPage - 1) * imagesPerPage;
  const currentImages = images.slice(startIndex, startIndex + imagesPerPage);

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.default,
        py: 6,
        minHeight: '100vh',
      }}
    >
      <Container maxWidth="lg">
        <ImageList
          cols={3}
          gap={16}
          sx={{
            [theme.breakpoints.down('sm')]: {
              cols: 1,
            },
            [theme.breakpoints.up('sm')]: {
              cols: 2,
            },
            [theme.breakpoints.up('md')]: {
              cols: 3,
            },
          }}
        >
          {currentImages.map((image, index) => (
            <ImageListItem key={index} onClick={() => handleImageClick(image)}>
              <img
                src={`${image.src}`}
                alt={image.alt}
                loading="lazy"
                style={{
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  cursor: 'pointer',
                }}
              />
            </ImageListItem>
          ))}
        </ImageList>

        {/* Pagination */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 4,
          }}
        >
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
          size="large"
          siblingCount={1}
        />
        </Box>

        {/* Modal */}
        <ImageModal
          open={!!selectedImage}
          onClose={handleCloseModal}
          image={selectedImage}
          zoomStyles={zoomStyles}
          handleMouseMove={handleMouseMove}
          handleTouchMove={handleTouchMove}
        />
      </Container>
    </Box>
  );
};

export default Gallery;
