import React from "react";
import { motion } from "framer-motion";

const companyLogos = [
  'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg',
  'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png',
  'https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg',
  'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg',
  'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
  'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg'
];

const TrustedBy = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="py-7 px-4 max-w-6xl mx-auto"
    >
      <div className="text-center mb-12">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Trusted By
        </p>
        <h3 className="text-base text-gray-700 font-normal">
          Được các công ty đổi mới trên toàn thế giới tin dùng
        </h3>
      </div>

      <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 lg:gap-16">
        {companyLogos.map((logo, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              delay: index * 0.1,
              duration: 0.4
            }}
            whileHover={{
              scale: 1.05,
              transition: { duration: 0.2 }
            }}
            className="relative group cursor-pointer flex-shrink-0"
          >
            <div className="w-20 h-12 flex items-center justify-center">
              <img
                src={logo}
                alt={`Company ${index + 1}`}
                className="max-h-full max-w-full object-contain filter grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-90 transition-all duration-300"
              />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="flex justify-center mt-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        <div className="w-12 h-px bg-gray-300"></div>
      </motion.div>
    </motion.div>
  );
};

export default TrustedBy;
