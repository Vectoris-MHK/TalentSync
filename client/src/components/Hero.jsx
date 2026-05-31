import React, { useContext, useRef, useState } from "react";
import { AppContext } from "../context/AppContext";
import bgimage from "../assets/bg-image-main.jpg";
import { motion } from "framer-motion";
import { FiSearch, FiMapPin, FiArrowRight } from "react-icons/fi";
import { FiBriefcase, FiUsers, FiTrendingUp } from "react-icons/fi";

const Hero = () => {
  const { setSearchFilter, setIsSearched } = useContext(AppContext);
  const titleRef = useRef(null);
  const locationRef = useRef(null);
  const [activeTag, setActiveTag] = useState(null);

  const popularTags = [
    "Lập trình",
    "Thiết kế",
    "Marketing",
    "Từ xa",
    "Quản lý",
  ];

  const stats = [
    { icon: FiBriefcase, number: "50K+", label: "Việc làm đang tuyển" },
    { icon: FiUsers, number: "1M+", label: "Người tìm việc" },
    { icon: FiTrendingUp, number: "95%", label: "Tỷ lệ thành công" }
  ];

  const handleTagClick = (tag) => {
    setActiveTag(tag);
    titleRef.current.value = tag;
    // Optional: automatically trigger search
    // onSearch({ preventDefault: () => {} });
  };

  const onSearch = (e) => {
    e.preventDefault();
    setSearchFilter({
      title: titleRef.current.value,
      location: locationRef.current.value,
    });
    setIsSearched(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Floating container with margin on all sides */}
      <section className="relative overflow-hidden mx-4 my-6 lg:mx-8 lg:my-10 rounded-3xl shadow-2xl">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0">
          <img
            src={bgimage}
            alt="Background"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-cyan-700/80 mix-blend-multiply"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
            >
              <span className="text-yellow-300">Công việc mơ ước</span> của bạn
              <br />
              cùng TalentSync
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl text-white/90 max-w-2xl mx-auto mb-10"
            >
              Bước tiến sự nghiệp lớn tiếp theo của bạn bắt đầu từ đây. Khám phá hàng nghìn
              cơ hội việc làm và làm chủ tương lai của bạn.
            </motion.p>

            {/* Stats bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex flex-wrap justify-center gap-8 mb-10"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-2 text-white/80"
                  whileHover={{ scale: 1.05, color: "#ffffff" }}
                  transition={{ type: "spring", damping: 15 }}
                >
                  <stat.icon className="text-[#fcde47] text-xl" />
                  <span className="font-bold text-xl">{stat.number}</span>
                  <span className="text-sm">{stat.label}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Enhanced search form */}
            <motion.form
              onSubmit={onSearch}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.8, type: "spring", damping: 20 }}
              className="max-w-4xl mx-auto group"
            >
              <div className="relative">
                {/* Glow effect */}
                <motion.div
                  className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-400 rounded-2xl blur-lg opacity-25 group-hover:opacity-50 transition-opacity duration-500"
                  animate={{
                    scale: [1, 1.02, 1],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                
                <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20">
                  <div className="flex flex-col md:flex-row">
                    <motion.div 
                      className="flex-1 flex items-center px-6 py-5 border-b md:border-b-0 md:border-r border-gray-200/50 group/input"
                      whileHover={{ backgroundColor: "rgba(255, 255, 255, 1)" }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiSearch className="text-gray-400 group-hover/input:text-blue-500 text-xl mr-4 transition-colors duration-200" />
                      <input
                        type="text"
                        ref={titleRef}
                        placeholder="Chức danh, từ khóa hoặc công ty"
                        className="w-full text-lg outline-none placeholder-gray-400 bg-transparent font-medium"
                        defaultValue={activeTag || ""}
                      />
                    </motion.div>
                    
                    <motion.div 
                      className="flex-1 flex items-center px-6 py-5 border-b md:border-b-0 md:border-r border-gray-200/50 group/input"
                      whileHover={{ backgroundColor: "rgba(255, 255, 255, 1)" }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiMapPin className="text-gray-400 group-hover/input:text-blue-500 text-xl mr-4 transition-colors duration-200" />
                      <input
                        type="text"
                        ref={locationRef}
                        placeholder="Địa điểm hoặc làm từ xa"
                        className="w-full text-lg outline-none placeholder-gray-400 bg-transparent font-medium"
                      />
                    </motion.div>
                    
                    <motion.button
                      type="submit"
                      className="relative bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700  hover:to-indigo-700 text-white px-8 py-5 font-bold text-lg flex items-center justify-center transition-all duration-300 overflow-hidden group/button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/button:opacity-100 transition-opacity duration-300"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.6 }}
                      />
                      <span className="relative z-10">Tìm việc</span>
                      <FiArrowRight className="ml-3 relative z-10 group-hover/button:translate-x-1 transition-transform duration-200" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.form>

            {/* Enhanced popular tags */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="mt-8 text-white/80"
            >
              <span className="mr-4 text-lg font-medium">Tìm kiếm phổ biến:</span>
              <div className="flex flex-wrap justify-center gap-3 mt-3">
                {popularTags.map((tag, i) => (
                  <motion.button
                    key={i}
                    onClick={() => handleTagClick(tag)}
                    className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 overflow-hidden group/tag ${
                      activeTag === tag
                        ? "bg-white/30 text-white shadow-lg"
                        : "bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                    }`}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + i * 0.1 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 to-purple-400/30 opacity-0 group-hover/tag:opacity-100 transition-opacity duration-300"
                      initial={{ scale: 0 }}
                      whileHover={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                    <span className="relative z-10">{tag}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

    </motion.div>
  );
};

export default Hero;
