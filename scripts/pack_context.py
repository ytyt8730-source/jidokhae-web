#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Smart Context Packer for LLM
============================

프로젝트 컨텍스트를 LLM에게 효율적으로 전달하기 위한 지능형 패킹 스크립트.

사용법:
    python pack_context.py                    # 전체 프로젝트
    python pack_context.py --target src/lib   # 특정 폴더만
    python pack_context.py --target core,docs # 여러 폴더
    python pack_context.py --no-minify        # 압축 없이
    python pack_context.py --max-tokens 50000 # 토큰 제한

Author: Claude Code
Version: 1.0.0
"""

import os
import re
import sys
import argparse
import io

# Windows 콘솔 UTF-8 설정
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
from pathlib import Path
from typing import List, Set, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime

# 클립보드 복사를 위한 선택적 import
try:
    import pyperclip
    HAS_CLIPBOARD = True
except ImportError:
    HAS_CLIPBOARD = False


@dataclass
class PackerConfig:
    """패커 설정"""
    # 항상 제외할 디렉토리
    exclude_dirs: Set[str] = field(default_factory=lambda: {
        '.git', 'node_modules', 'build', 'dist', '__pycache__',
        '.next', '.vercel', '.turbo', 'coverage', '.nyc_output',
        'venv', '.venv', 'env', '.env', '.idea', '.vscode',
    })

    # 항상 제외할 파일
    exclude_files: Set[str] = field(default_factory=lambda: {
        'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
        '.DS_Store', 'Thumbs.db', '.gitignore',
    })

    # 제외할 확장자
    exclude_extensions: Set[str] = field(default_factory=lambda: {
        '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp',
        '.mp4', '.mp3', '.wav', '.avi', '.mov',
        '.pdf', '.doc', '.docx', '.xls', '.xlsx',
        '.zip', '.tar', '.gz', '.rar', '.7z',
        '.exe', '.dll', '.so', '.dylib',
        '.pyc', '.pyo', '.class', '.o',
        '.woff', '.woff2', '.ttf', '.eot', '.otf',
    })

    # 최우선 포함 파일/폴더 (항상 포함)
    priority_paths: Set[str] = field(default_factory=lambda: {
        '.cursorrules', 'CLAUDE.md', 'roadmap',
        'log/current-state.md', 'core',
    })

    # 중요 파일 패턴 (우선 정렬)
    important_patterns: List[str] = field(default_factory=lambda: [
        r'\.cursorrules$',
        r'CLAUDE\.md$',
        r'current-state\.md$',
        r'milestones\.md$',
        r'PRD\.md$',
        r'package\.json$',
        r'tsconfig\.json$',
        r'tailwind\.config\.',
    ])

    # 최대 파일 크기 (bytes)
    max_file_size: int = 100_000  # 100KB

    # 토큰 추정 (단어당 평균 토큰)
    tokens_per_word: float = 1.3
    tokens_per_char: float = 0.25


class TokenEstimator:
    """토큰 수 추정기"""

    def __init__(self, config: PackerConfig):
        self.config = config

    def estimate(self, text: str) -> int:
        """텍스트의 토큰 수 추정"""
        # 방법 1: 단어 기반
        words = len(text.split())
        word_tokens = int(words * self.config.tokens_per_word)

        # 방법 2: 문자 기반
        char_tokens = int(len(text) * self.config.tokens_per_char)

        # 두 방법의 평균
        return (word_tokens + char_tokens) // 2

    def format_tokens(self, tokens: int) -> str:
        """토큰 수를 읽기 쉬운 형태로 포맷"""
        if tokens >= 1_000_000:
            return f"{tokens / 1_000_000:.1f}M"
        elif tokens >= 1_000:
            return f"{tokens / 1_000:.1f}K"
        return str(tokens)


class ContentMinifier:
    """코드 압축기"""

    def __init__(self, enabled: bool = True):
        self.enabled = enabled

    def minify(self, content: str, file_ext: str) -> str:
        """코드 압축 (빈 줄 제거, 간단한 정리)"""
        if not self.enabled:
            return content

        # 파일이 너무 크면 정규식 건너뛰기 (성능 최적화)
        if len(content) > 50000:
            content = content.strip()
            return content

        # 연속된 빈 줄을 하나로 (간단한 패턴만)
        content = re.sub(r'\n{3,}', '\n\n', content)

        # 파일 시작/끝의 빈 줄 제거
        content = content.strip()

        return content


class FileFilter:
    """파일 필터링"""

    def __init__(self, config: PackerConfig):
        self.config = config

    def should_exclude_dir(self, dir_name: str) -> bool:
        """디렉토리 제외 여부"""
        return dir_name in self.config.exclude_dirs or dir_name.startswith('.')

    def should_exclude_file(self, file_path: Path) -> bool:
        """파일 제외 여부"""
        # 파일명으로 제외
        if file_path.name in self.config.exclude_files:
            return True

        # 확장자로 제외
        if file_path.suffix.lower() in self.config.exclude_extensions:
            return True

        # 파일 크기로 제외
        try:
            if file_path.stat().st_size > self.config.max_file_size:
                return True
        except OSError:
            return True

        return False

    def is_priority_path(self, rel_path: str) -> bool:
        """우선 포함 경로인지 확인"""
        rel_path_lower = rel_path.lower().replace('\\', '/')
        for priority in self.config.priority_paths:
            if rel_path_lower == priority.lower() or rel_path_lower.startswith(priority.lower() + '/'):
                return True
        return False

    def get_priority_score(self, rel_path: str) -> int:
        """파일의 우선순위 점수 (낮을수록 먼저)"""
        # 중요 패턴 매칭
        for i, pattern in enumerate(self.config.important_patterns):
            if re.search(pattern, rel_path, re.IGNORECASE):
                return i

        # 우선 경로
        if self.is_priority_path(rel_path):
            return 100

        # 일반 파일
        return 1000


@dataclass
class PackedFile:
    """패킹된 파일 정보"""
    rel_path: str
    content: str
    original_size: int
    packed_size: int
    priority: int


class SmartContextPacker:
    """Smart Context Packer 메인 클래스"""

    def __init__(
        self,
        root_dir: str,
        targets: Optional[List[str]] = None,
        minify: bool = True,
        max_tokens: Optional[int] = None,
        config: Optional[PackerConfig] = None,
    ):
        self.root_dir = Path(root_dir).resolve()
        self.targets = targets
        self.minify = minify
        self.max_tokens = max_tokens
        self.config = config or PackerConfig()

        self.filter = FileFilter(self.config)
        self.minifier = ContentMinifier(minify)
        self.estimator = TokenEstimator(self.config)

        self.packed_files: List[PackedFile] = []
        self.stats = {
            'total_files': 0,
            'included_files': 0,
            'excluded_files': 0,
            'original_size': 0,
            'packed_size': 0,
        }

    def discover_files(self) -> List[Path]:
        """파일 탐색"""
        files = []

        # 타겟이 지정된 경우
        if self.targets:
            # 항상 포함할 우선 파일들 먼저 추가
            for priority_path in self.config.priority_paths:
                full_path = self.root_dir / priority_path
                if full_path.is_file():
                    files.append(full_path)
                elif full_path.is_dir():
                    files.extend(self._scan_directory(full_path))

            # 타겟 폴더들 추가
            for target in self.targets:
                target_path = self.root_dir / target
                if target_path.is_file():
                    files.append(target_path)
                elif target_path.is_dir():
                    files.extend(self._scan_directory(target_path))
        else:
            # 전체 스캔
            files = self._scan_directory(self.root_dir)

        # 중복 제거
        files = list(dict.fromkeys(files))

        return files

    def _scan_directory(self, directory: Path) -> List[Path]:
        """디렉토리 재귀 스캔"""
        files = []

        try:
            for item in directory.iterdir():
                if item.is_dir():
                    if not self.filter.should_exclude_dir(item.name):
                        files.extend(self._scan_directory(item))
                elif item.is_file():
                    if not self.filter.should_exclude_file(item):
                        files.append(item)
        except PermissionError:
            pass

        return files

    def pack_file(self, file_path: Path) -> Optional[PackedFile]:
        """단일 파일 패킹"""
        try:
            rel_path = file_path.relative_to(self.root_dir).as_posix()

            # 파일 읽기
            try:
                content = file_path.read_text(encoding='utf-8')
            except UnicodeDecodeError:
                # 바이너리 파일 스킵
                return None

            original_size = len(content)

            # 압축
            packed_content = self.minifier.minify(content, file_path.suffix)
            packed_size = len(packed_content)

            # 우선순위
            priority = self.filter.get_priority_score(rel_path)

            return PackedFile(
                rel_path=rel_path,
                content=packed_content,
                original_size=original_size,
                packed_size=packed_size,
                priority=priority,
            )
        except Exception as e:
            print(f"⚠️  파일 처리 실패: {file_path} - {e}")
            return None

    def pack(self) -> str:
        """전체 패킹 실행"""
        print("🔍 파일 탐색 중...")
        files = self.discover_files()
        self.stats['total_files'] = len(files)

        total = len(files)
        print(f"📦 {total}개 파일 패킹 중...")

        # 파일 패킹 (진행 상황 표시)
        for i, file_path in enumerate(files):
            # 10개마다 또는 마지막에 진행 상황 출력
            if (i + 1) % 10 == 0 or (i + 1) == total:
                print(f"   진행: {i + 1}/{total} ({(i + 1) * 100 // total}%)", end='\r')

            packed = self.pack_file(file_path)
            if packed:
                self.packed_files.append(packed)
                self.stats['included_files'] += 1
                self.stats['original_size'] += packed.original_size
                self.stats['packed_size'] += packed.packed_size
            else:
                self.stats['excluded_files'] += 1

        print()  # 줄바꿈

        # 우선순위 정렬
        self.packed_files.sort(key=lambda x: x.priority)

        # XML 포맷으로 조합
        print("📝 출력 생성 중...")
        output = self._generate_output()

        # 토큰 제한 적용
        if self.max_tokens:
            output = self._apply_token_limit(output)

        return output

    def _generate_output(self) -> str:
        """출력 생성"""
        parts = []

        # 헤더
        parts.append(self._generate_header())

        # 파일 목록
        parts.append("<file_list>")
        for pf in self.packed_files:
            parts.append(f"  - {pf.rel_path}")
        parts.append("</file_list>\n")

        # 파일 내용
        parts.append("<files>")
        for pf in self.packed_files:
            parts.append(f'\n<file path="{pf.rel_path}">')
            parts.append(pf.content)
            parts.append('</file>')
        parts.append("\n</files>")

        return '\n'.join(parts)

    def _generate_header(self) -> str:
        """헤더 생성"""
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # 타겟 정보
        if self.targets:
            target_info = ", ".join(self.targets)
        else:
            target_info = "전체 프로젝트"

        return f"""<context_pack>
<meta>
  <project>{self.root_dir.name}</project>
  <target>{target_info}</target>
  <generated>{now}</generated>
  <files_count>{self.stats['included_files']}</files_count>
  <minified>{"yes" if self.minify else "no"}</minified>
</meta>
"""

    def _apply_token_limit(self, output: str) -> str:
        """토큰 제한 적용"""
        current_tokens = self.estimator.estimate(output)

        if current_tokens <= self.max_tokens:
            return output

        print(f"⚠️  토큰 제한 초과: {self.estimator.format_tokens(current_tokens)} > {self.estimator.format_tokens(self.max_tokens)}")
        print("   우선순위가 낮은 파일들을 제거합니다...")

        # 먼저 몇 개를 제거해야 하는지 계산
        removed_count = 0
        while current_tokens > self.max_tokens and self.packed_files:
            removed = self.packed_files.pop()
            removed_count += 1
            # 제거된 파일의 토큰만 대략 빼기 (재생성 없이)
            removed_tokens = self.estimator.estimate(removed.content) + 50  # 태그 overhead
            current_tokens -= removed_tokens

        if removed_count > 0:
            print(f"   {removed_count}개 파일 제거됨")
            # 최종 출력 한 번만 재생성
            output = self._generate_output()

        return output

    def get_report(self, output: str) -> str:
        """결과 리포트 생성"""
        tokens = self.estimator.estimate(output)

        lines = [
            "",
            "━" * 50,
            "📊 패킹 결과",
            "━" * 50,
            f"  📁 총 탐색 파일: {self.stats['total_files']}개",
            f"  ✅ 포함된 파일: {self.stats['included_files']}개",
            f"  ❌ 제외된 파일: {self.stats['excluded_files']}개",
            "",
            f"  📏 원본 크기: {self._format_size(self.stats['original_size'])}",
            f"  📦 패킹 크기: {self._format_size(self.stats['packed_size'])}",
            f"  💾 압축률: {self._calc_compression_ratio()}%",
            "",
            f"  🎯 추정 토큰: {self.estimator.format_tokens(tokens)} ({tokens:,})",
            "━" * 50,
        ]

        return '\n'.join(lines)

    def _format_size(self, size: int) -> str:
        """파일 크기 포맷"""
        if size >= 1_000_000:
            return f"{size / 1_000_000:.2f} MB"
        elif size >= 1_000:
            return f"{size / 1_000:.2f} KB"
        return f"{size} bytes"

    def _calc_compression_ratio(self) -> str:
        """압축률 계산"""
        if self.stats['original_size'] == 0:
            return "0"
        ratio = (1 - self.stats['packed_size'] / self.stats['original_size']) * 100
        return f"{ratio:.1f}"


def copy_to_clipboard(text: str) -> bool:
    """클립보드에 복사"""
    if HAS_CLIPBOARD:
        try:
            pyperclip.copy(text)
            return True
        except Exception:
            pass

    # Windows 대안
    if sys.platform == 'win32':
        try:
            import subprocess
            process = subprocess.Popen(
                ['clip'],
                stdin=subprocess.PIPE,
                shell=True
            )
            process.communicate(text.encode('utf-8'))
            return True
        except Exception:
            pass

    return False


def main():
    parser = argparse.ArgumentParser(
        description='Smart Context Packer - LLM을 위한 지능형 컨텍스트 패커',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
예시:
  python pack_context.py                          # 전체 프로젝트
  python pack_context.py --target src/lib         # 특정 폴더
  python pack_context.py --target "core,docs"     # 여러 폴더
  python pack_context.py --no-minify              # 압축 없이
  python pack_context.py --max-tokens 50000       # 토큰 제한
  python pack_context.py --output my_context.txt  # 출력 파일 지정
        """
    )

    parser.add_argument(
        '--target', '-t',
        type=str,
        help='패킹할 특정 폴더/파일 (쉼표로 구분)'
    )

    parser.add_argument(
        '--root', '-r',
        type=str,
        default='.',
        help='프로젝트 루트 디렉토리 (기본: 현재 디렉토리)'
    )

    parser.add_argument(
        '--output', '-o',
        type=str,
        default='_CONTEXT_PACK.txt',
        help='출력 파일명 (기본: _CONTEXT_PACK.txt)'
    )

    parser.add_argument(
        '--no-minify',
        action='store_true',
        help='코드 압축 비활성화'
    )

    parser.add_argument(
        '--max-tokens',
        type=int,
        help='최대 토큰 수 제한'
    )

    parser.add_argument(
        '--no-clipboard',
        action='store_true',
        help='클립보드 복사 비활성화'
    )

    parser.add_argument(
        '--list-only',
        action='store_true',
        help='파일 목록만 출력 (패킹 안 함)'
    )

    args = parser.parse_args()

    # 타겟 파싱
    targets = None
    if args.target:
        targets = [t.strip() for t in args.target.split(',')]

    # 루트 디렉토리 결정
    root_dir = Path(args.root).resolve()

    # jidokhae 폴더가 있으면 상위에서 실행한 것으로 간주
    if not (root_dir / 'CLAUDE.md').exists() and (root_dir / 'jidokhae').exists():
        # 이미 올바른 위치
        pass

    print(f"🚀 Smart Context Packer")
    print(f"   루트: {root_dir}")
    if targets:
        print(f"   타겟: {', '.join(targets)}")
    print()

    # 패커 생성
    packer = SmartContextPacker(
        root_dir=str(root_dir),
        targets=targets,
        minify=not args.no_minify,
        max_tokens=args.max_tokens,
    )

    # 파일 목록만 출력
    if args.list_only:
        files = packer.discover_files()
        print(f"📁 발견된 파일: {len(files)}개\n")
        for f in files:
            rel_path = f.relative_to(root_dir).as_posix()
            priority = packer.filter.get_priority_score(rel_path)
            marker = "⭐" if priority < 100 else "  "
            print(f"  {marker} {rel_path}")
        return

    # 패킹 실행
    output = packer.pack()

    # 결과 리포트
    report = packer.get_report(output)
    print(report)

    # 파일 저장
    output_path = root_dir / args.output
    output_path.write_text(output, encoding='utf-8')
    print(f"💾 저장됨: {output_path}")

    # 클립보드 복사
    if not args.no_clipboard:
        if copy_to_clipboard(output):
            print("📋 클립보드에 복사됨!")
        else:
            print("⚠️  클립보드 복사 실패 (pyperclip 설치 필요: pip install pyperclip)")

    print()


if __name__ == '__main__':
    main()
