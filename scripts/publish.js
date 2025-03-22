/**
 * Script tự động hóa quy trình xuất bản
 * - Commit các thay đổi
 * - Tạo tag
 * - Đẩy code và tag lên repository
 * - Xuất bản lên npm
 */
const { execSync } = require('child_process');
const { version } = require('../package.json');

// Hàm thực thi lệnh shell và hiển thị output
function runCommand(command) {
  console.log(`Đang thực thi: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    return true;
  } catch (error) {
    console.error(`Lỗi khi thực thi lệnh: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Hiển thị thông tin phiên bản
console.log(`\n===== BẮT ĐẦU QUY TRÌNH XUẤT BẢN PHIÊN BẢN ${version} =====\n`);

// 1. Thêm tất cả file đã thay đổi
if (!runCommand('git add .')) {
  console.error('Không thể thêm các file thay đổi. Đang dừng quy trình.');
  process.exit(1);
}

// 2. Commit với message mô tả các thay đổi
const commitMessage = `Phiên bản ${version}: Cập nhật từ quy trình tự động hóa`;
if (!runCommand(`git commit -m "${commitMessage}"`)) {
  console.log('Không có thay đổi để commit hoặc có lỗi xảy ra. Tiếp tục quy trình...');
}

// 3. Tạo tag cho phiên bản mới
if (!runCommand(`git tag -a v${version} -m "Phiên bản ${version}"`)) {
  console.error('Không thể tạo tag. Đang dừng quy trình.');
  process.exit(1);
}

// 4. Đẩy lên nhánh main/master
if (!runCommand('git push origin master')) {
  console.error('Không thể đẩy lên nhánh chính. Kiểm tra kết nối và quyền truy cập.');
  process.exit(1);
}

// 5. Đẩy tag lên repository
if (!runCommand(`git push origin v${version}`)) {
  console.error('Không thể đẩy tag. Đang dừng quy trình.');
  process.exit(1);
}

// 6. Xuất bản gói lên npm
console.log('\n===== ĐANG XUẤT BẢN LÊN NPM =====\n');
if (!runCommand('npm publish --access public')) {
  console.error('Không thể xuất bản lên npm. Kiểm tra kết nối và đảm bảo đã đăng nhập.');
  process.exit(1);
}

console.log(`\n===== XUẤT BẢN PHIÊN BẢN ${version} HOÀN TẤT =====\n`);
console.log('Gói đã được đẩy lên Git và xuất bản thành công lên npm!');
