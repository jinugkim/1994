class BusSeatManager {
    constructor() {
        this.passengers = [];
        this.locationColors = {};
        this.colorPalette = [
            '#e74c3c', // 빨강
            '#3498db', // 파랑
            '#2ecc71', // 초록
            '#f39c12', // 주황
            '#9b59b6', // 보라
            '#1abc9c', // 청록
            '#e67e22', // 진한 주황
            '#34495e', // 회색
            '#e91e63', // 분홍
            '#00bcd4', // 하늘색
            '#8bc34a', // 연두
            '#ff5722', // 딥 오렌지
            '#795548', // 갈색
            '#607d8b'  // 청회색
        ];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const parseButton = document.getElementById('parseButton');
        const clearButton = document.getElementById('clearButton');
        const textInput = document.getElementById('textInput');

        parseButton.addEventListener('click', () => this.parseAndDisplay());
        clearButton.addEventListener('click', () => this.clearAll());
        
        // Enter 키로도 파싱 실행 (Ctrl+Enter)
        textInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.parseAndDisplay();
            }
        });

        // 실시간 입력 상태 표시
        textInput.addEventListener('input', () => this.showInputStatus());
        textInput.addEventListener('paste', () => {
            setTimeout(() => this.showInputStatus(), 100);
        });
    }

    showInputStatus() {
        const textInput = document.getElementById('textInput');
        const statusDiv = document.getElementById('inputStatus');
        const inputText = textInput.value.trim();

        if (!inputText) {
            statusDiv.innerHTML = '';
            return;
        }

        const lines = inputText.split('\n').filter(line => line.trim());
        const previewResult = this.parsePassengerTextWithFeedback(inputText);
        
        let statusHTML = '';
        
        if (previewResult.passengers.length > 0) {
            statusHTML += `<span class="status-success">✓ ${previewResult.passengers.length}명의 승객 정보 인식됨</span>`;
        }
        
        if (previewResult.errors.length > 0) {
            statusHTML += `<span class="status-error"> | ⚠️ ${previewResult.errors.length}줄 처리 불가</span>`;
        }
        
        if (previewResult.warnings.length > 0) {
            statusHTML += `<span class="status-warning"> | ⚡ ${previewResult.warnings.length}개 주의사항</span>`;
        }

        // 중복 좌석 체크
        const seatNumbers = previewResult.passengers.map(p => p.seatNumber);
        const duplicates = seatNumbers.filter((seat, index) => seatNumbers.indexOf(seat) !== index);
        if (duplicates.length > 0) {
            statusHTML += `<span class="status-error"> | 🚫 중복 좌석: ${[...new Set(duplicates)].join(', ')}</span>`;
        }

        statusDiv.innerHTML = statusHTML;
    }

    parsePassengerText(text) {
        const passengers = [];
        const lines = text.split('\n').filter(line => line.trim());

        for (const line of lines) {
            const passenger = this.parsePassengerLine(line);
            if (passenger) {
                passengers.push(passenger);
            }
        }

        return passengers;
    }

    parsePassengerTextWithFeedback(text) {
        const passengers = [];
        const errors = [];
        const warnings = [];
        const lines = text.split('\n').filter(line => line.trim());

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const passenger = this.parsePassengerLine(line);
            
            if (passenger) {
                passengers.push(passenger);
                
                // 경고 사항 체크
                if (passenger.name.length < 2) {
                    warnings.push(`줄 ${i + 1}: 이름이 너무 짧습니다 (${passenger.name})`);
                }
                
                if (!this.isCommonLocation(passenger.location)) {
                    warnings.push(`줄 ${i + 1}: 일반적이지 않은 지역명입니다 (${passenger.location})`);
                }
            } else {
                // 파싱 실패한 줄 분석
                const errorAnalysis = this.analyzeParsingError(line, i + 1);
                errors.push(errorAnalysis);
            }
        }

        return {
            passengers: passengers,
            errors: errors,
            warnings: warnings
        };
    }

    analyzeParsingError(line, lineNumber) {
        const suggestions = [];
        
        // 이름 검출
        const nameMatch = line.match(/[가-힣]{2,4}/);
        if (!nameMatch) {
            suggestions.push('한글 이름을 포함해주세요');
        }
        
        // 숫자 검출
        const numberMatch = line.match(/\d+/);
        if (!numberMatch) {
            suggestions.push('좌석 번호를 포함해주세요');
        }
        
        // 지역명 검출
        const locationMatch = line.match(/[가-힣]{2,4}(?:역|동|구|시)?/);
        if (!locationMatch) {
            suggestions.push('탑승지를 포함해주세요');
        }
        
        return {
            line: lineNumber,
            text: line,
            suggestions: suggestions
        };
    }

    isCommonLocation(location) {
        const commonLocations = [
            '양재', '강남', '사당', '서초', '논현', '신논현', '역삼', '선릉', '삼성', '잠실',
            '신촌', '홍대', '이태원', '명동', '동대문', '성수', '건대', '왕십리', '종로',
            '구로', '신도림', '영등포', '여의도', '마포', '공덕', '신촌', '홍익대'
        ];
        
        return commonLocations.some(loc => location.includes(loc));
    }

    showParsingError(errors, originalText) {
        let errorMessage = '다음 줄들을 처리할 수 없습니다:\n\n';
        
        errors.forEach(error => {
            errorMessage += `줄 ${error.line}: "${error.text}"\n`;
            if (error.suggestions.length > 0) {
                errorMessage += `  → ${error.suggestions.join(', ')}\n`;
            }
            errorMessage += '\n';
        });
        
        errorMessage += '지원하는 형식 예시:\n';
        errorMessage += '• 1. 김진욱(입완, 양재, 1)\n';
        errorMessage += '• 김진욱 양재 1번 입금완료\n';
        errorMessage += '• 김진욱/양재/1/입완\n';
        errorMessage += '• 김진욱: 양재 1번 돈냄\n';
        
        alert(errorMessage);
    }

    showParsingWarnings(warnings) {
        if (warnings.length > 0) {
            const warningMessage = '주의사항:\n\n' + warnings.join('\n');
            console.warn(warningMessage);
            
            // 사용자에게 선택적으로 표시
            if (confirm(warningMessage + '\n\n계속 진행하시겠습니까?')) {
                return true;
            } else {
                return false;
            }
        }
        return true;
    }

    parsePassengerLine(line) {
        // 자연어 처리를 통한 다양한 형식 지원
        return this.nlpParsePassengerLine(line);
    }

    nlpParsePassengerLine(line) {
        const cleanLine = line.trim();
        
        // 다양한 패턴들을 시도
        const patterns = [
            // 기본 형식: "1. 김진욱(입완, 양재, 1)"
            /(\d+)\.\s*([^(]+)\(([^,]+),\s*([^,]+),\s*(\d+)\)/,
            // 공백 구분: "1 김진욱 입완 양재 1"
            /(\d+)\s+([가-힣a-zA-Z]+)\s+([^\s]+)\s+([^\s]+)\s+(\d+)/,
            // 자연어 형식: "김진욱 양재 1번 입금완료"
            /([가-힣a-zA-Z]+)\s+([가-힣]+(?:역|동|구|시)?)\s+(\d+)(?:번|좌석)?\s*([^\s]*)/,
            // 괄호 다른 순서: "1. 김진욱(1, 양재, 입완)"
            /(\d+)\.\s*([^(]+)\((\d+),\s*([^,]+),\s*([^)]+)\)/,
            // 슬래시 구분: "김진욱/양재/1/입완"
            /([가-힣a-zA-Z]+)\/([^\/]+)\/(\d+)\/([^\/\s]+)/,
            // 콜론 구분: "김진욱: 양재 1번 입금완료"
            /([가-힣a-zA-Z]+):\s*([가-힣]+(?:역|동|구|시)?)\s+(\d+)(?:번|좌석)?\s*([^\s]*)/
        ];

        for (let i = 0; i < patterns.length; i++) {
            const match = cleanLine.match(patterns[i]);
            if (match) {
                return this.extractPassengerInfo(match, i);
            }
        }

        // 더 유연한 자연어 처리
        return this.fuzzyParsePassengerLine(cleanLine);
    }

    extractPassengerInfo(match, patternIndex) {
        let orderNum, name, paymentStatus, location, seatNum;

        switch (patternIndex) {
            case 0: // 기본 형식
                [, orderNum, name, paymentStatus, location, seatNum] = match;
                break;
            case 1: // 공백 구분
                [, orderNum, name, paymentStatus, location, seatNum] = match;
                break;
            case 2: // 자연어 형식
                [, name, location, seatNum, paymentStatus] = match;
                orderNum = null; // 자동 생성
                break;
            case 3: // 괄호 다른 순서
                [, orderNum, name, seatNum, location, paymentStatus] = match;
                break;
            case 4: // 슬래시 구분
                [, name, location, seatNum, paymentStatus] = match;
                orderNum = null;
                break;
            case 5: // 콜론 구분
                [, name, location, seatNum, paymentStatus] = match;
                orderNum = null;
                break;
        }

        // 데이터 정리 및 정규화
        name = this.cleanName(name);
        location = this.normalizeLocation(location);
        paymentStatus = this.normalizePaymentStatus(paymentStatus || '');
        seatNum = parseInt(seatNum);
        orderNum = orderNum ? parseInt(orderNum) : this.getNextOrderNumber();

        // 유효성 검사
        if (!name || !location || !seatNum || isNaN(seatNum)) {
            return null;
        }

        return {
            orderNumber: orderNum,
            name: name,
            paymentStatus: paymentStatus,
            location: location,
            seatNumber: seatNum
        };
    }

    fuzzyParsePassengerLine(line) {
        // 정규식으로 추출 가능한 요소들 찾기
        const nameMatch = line.match(/[가-힣]{2,4}/); // 한글 이름
        const seatMatch = line.match(/(\d{1,2})(?:번|좌석)?/); // 좌석번호
        const locationMatch = line.match(/[가-힣]{2,4}(?:역|동|구|시|면|읍)?/g); // 지역명들
        
        if (!nameMatch || !seatMatch) {
            return null;
        }

        const name = nameMatch[0];
        const seatNum = parseInt(seatMatch[1]);
        
        // 지역명 중에서 이름이 아닌 것 찾기
        let location = '';
        if (locationMatch) {
            for (let loc of locationMatch) {
                if (loc !== name && this.isValidLocation(loc)) {
                    location = loc;
                    break;
                }
            }
        }

        // 입금 상태 추출
        const paymentStatus = this.extractPaymentStatus(line);

        if (!location) {
            return null;
        }

        return {
            orderNumber: this.getNextOrderNumber(),
            name: name,
            paymentStatus: paymentStatus,
            location: location,
            seatNumber: seatNum
        };
    }

    cleanName(name) {
        return name.trim().replace(/[^\가-힣a-zA-Z]/g, '');
    }

    normalizeLocation(location) {
        const locationMap = {
            // 역명 정규화
            '양재역': '양재', '양재동': '양재',
            '강남역': '강남', '강남구': '강남',
            '사당역': '사당', '사당동': '사당',
            '서초역': '서초', '서초구': '서초', '서초동': '서초',
            '논현역': '논현', '논현동': '논현',
            '신논현역': '신논현', '신논현동': '신논현',
            '역삼역': '역삼', '역삼동': '역삼',
            '선릉역': '선릉', '선릉동': '선릉',
            '삼성역': '삼성', '삼성동': '삼성',
            '잠실역': '잠실', '잠실동': '잠실'
        };

        const cleaned = location.trim();
        return locationMap[cleaned] || cleaned;
    }

    isValidLocation(location) {
        const commonLocations = [
            '양재', '강남', '사당', '서초', '논현', '신논현', '역삼', '선릉', '삼성', '잠실',
            '신촌', '홍대', '이태원', '명동', '동대문', '성수', '건대', '왕십리', '종로'
        ];
        
        return commonLocations.some(loc => location.includes(loc));
    }

    extractPaymentStatus(line) {
        // 입금 관련 키워드 찾기
        const paidKeywords = ['입완', '입금완료', '완료', '입금됨', '결제완료', '돈냄', '냈어', '입금했', '결제했'];
        const pendingKeywords = ['예정', '입금예정', '미입금', '대기', '예약', '안냄', '안했', '예정임'];

        const lowerLine = line.toLowerCase();
        
        for (let keyword of paidKeywords) {
            if (line.includes(keyword)) {
                return 'paid';
            }
        }
        
        for (let keyword of pendingKeywords) {
            if (line.includes(keyword)) {
                return 'pending';
            }
        }
        
        return 'pending'; // 기본값
    }

    getNextOrderNumber() {
        return this.passengers.length + 1;
    }

    normalizePaymentStatus(status) {
        // 입금완료 관련 키워드들
        const paidKeywords = ['입완', '입금완료', '완료', '입금됨', '결제완료'];
        // 입금예정 관련 키워드들
        const pendingKeywords = ['예정', '입금예정', '미입금', '대기', '예약'];

        const statusLower = status.toLowerCase();
        
        if (paidKeywords.some(keyword => status.includes(keyword))) {
            return 'paid';
        } else if (pendingKeywords.some(keyword => status.includes(keyword))) {
            return 'pending';
        }
        
        // 기본값은 pending
        return 'pending';
    }

    validateSeatNumber(seatNumber) {
        return seatNumber >= 1 && seatNumber <= 28;
    }

    parseAndDisplay() {
        const textInput = document.getElementById('textInput');
        const inputText = textInput.value.trim();

        if (!inputText) {
            alert('승객 정보를 입력해주세요.');
            return;
        }

        try {
            // 기존 데이터 초기화
            this.clearSeats();

            // 텍스트 파싱 (자연어 처리 포함)
            const parseResult = this.parsePassengerTextWithFeedback(inputText);
            this.passengers = parseResult.passengers;

            if (this.passengers.length === 0) {
                this.showParsingError(parseResult.errors, inputText);
                return;
            }

            // 파싱 결과 피드백 표시
            if (parseResult.warnings.length > 0) {
                this.showParsingWarnings(parseResult.warnings);
            }

            // 좌석 번호 유효성 검사
            const invalidSeats = this.passengers.filter(p => !this.validateSeatNumber(p.seatNumber));
            if (invalidSeats.length > 0) {
                alert(`잘못된 좌석 번호가 있습니다: ${invalidSeats.map(p => p.seatNumber).join(', ')}\n좌석 번호는 1-28 사이여야 합니다.`);
                return;
            }

            // 중복 좌석 검사
            const seatNumbers = this.passengers.map(p => p.seatNumber);
            const duplicateSeats = seatNumbers.filter((seat, index) => seatNumbers.indexOf(seat) !== index);
            if (duplicateSeats.length > 0) {
                alert(`중복된 좌석 번호가 있습니다: ${[...new Set(duplicateSeats)].join(', ')}`);
                return;
            }

            // 탑승지별 색상 할당
            this.assignLocationColors();
            
            // 좌석 배치도 업데이트
            this.displaySeats();
            this.displayLocationStats();
            this.displayPassengerList();

            // 성공 메시지
            console.log(`${this.passengers.length}명의 승객 정보를 처리했습니다.`);

        } catch (error) {
            console.error('파싱 오류:', error);
            alert('텍스트 처리 중 오류가 발생했습니다. 입력 형식을 확인해주세요.');
        }
    }

    assignLocationColors() {
        // 고유한 탑승지 목록 추출
        const uniqueLocations = [...new Set(this.passengers.map(p => p.location))];
        
        // 각 탑승지에 색상 할당
        uniqueLocations.forEach((location, index) => {
            if (!this.locationColors[location]) {
                this.locationColors[location] = this.colorPalette[index % this.colorPalette.length];
            }
        });
    }

    displaySeats() {
        // 모든 좌석 요소 가져오기
        const seatElements = document.querySelectorAll('.seat[data-seat]');

        this.passengers.forEach(passenger => {
            const seatElement = document.querySelector(`[data-seat="${passenger.seatNumber}"]`);
            if (seatElement) {
                // 좌석 상태 클래스 추가
                seatElement.classList.add('occupied');
                seatElement.classList.add(passenger.paymentStatus);
                
                // 탑승지별 색상 적용
                const locationColor = this.locationColors[passenger.location];
                if (locationColor) {
                    seatElement.style.backgroundColor = locationColor;
                    seatElement.style.borderColor = this.darkenColor(locationColor, 20);
                    
                    // 입금 상태에 따른 투명도 조정
                    if (passenger.paymentStatus === 'pending') {
                        seatElement.style.opacity = '0.7';
                    } else {
                        seatElement.style.opacity = '1';
                    }
                }
                
                // 승객 이름을 data 속성으로 추가 (CSS에서 표시용)
                seatElement.setAttribute('data-passenger-name', passenger.name);
                
                // 툴팁 추가
                seatElement.title = `${passenger.name}\n${passenger.paymentStatus === 'paid' ? '입금완료' : '입금예정'}\n${passenger.location}`;
            }
        });
    }

    darkenColor(color, percent) {
        // 색상을 어둡게 만드는 유틸리티 함수
        const num = parseInt(color.replace("#",""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    displayLocationStats() {
        const locationStats = document.getElementById('locationStats');
        
        if (this.passengers.length === 0) {
            locationStats.innerHTML = '<p style="color: #7f8c8d; text-align: center;">통계 정보가 없습니다.</p>';
            return;
        }

        // 탑승지별 통계 계산
        const locationData = {};
        this.passengers.forEach(passenger => {
            const location = passenger.location;
            if (!locationData[location]) {
                locationData[location] = {
                    total: 0,
                    paid: 0,
                    pending: 0
                };
            }
            locationData[location].total++;
            if (passenger.paymentStatus === 'paid') {
                locationData[location].paid++;
            } else {
                locationData[location].pending++;
            }
        });

        // 탑승지별 통계 HTML 생성
        const locationStatsHTML = Object.entries(locationData)
            .sort((a, b) => b[1].total - a[1].total) // 인원수 많은 순으로 정렬
            .map(([location, stats]) => {
                const locationColor = this.locationColors[location] || '#3498db';
                return `
                    <div class="location-stat-item" style="border-left-color: ${locationColor};">
                        <div class="location-color-indicator" style="background-color: ${locationColor};"></div>
                        <div class="location-info">
                            <div class="location-name">${location}</div>
                            <div class="location-summary">총 ${stats.total}명</div>
                            <div class="location-details">
                                <span class="paid-count">✓ 입금완료 ${stats.paid}명</span>
                                <span class="pending-count">⏳ 입금예정 ${stats.pending}명</span>
                            </div>
                        </div>
                        <div class="location-count" style="background-color: ${locationColor};">${stats.total}</div>
                    </div>
                `;
            }).join('');

        // 전체 통계
        const totalStats = this.getStatistics();
        const totalStatsHTML = `
            <div class="total-stats">
                <div class="total-stat">
                    <div class="number">${totalStats.total}</div>
                    <div class="label">총 승객</div>
                </div>
                <div class="total-stat">
                    <div class="number">${totalStats.paid}</div>
                    <div class="label">입금완료</div>
                </div>
                <div class="total-stat">
                    <div class="number">${totalStats.pending}</div>
                    <div class="label">입금예정</div>
                </div>
                <div class="total-stat">
                    <div class="number">${totalStats.empty}</div>
                    <div class="label">빈 좌석</div>
                </div>
            </div>
        `;

        // 색상 범례 생성
        const colorLegendHTML = Object.entries(this.locationColors)
            .map(([location, color]) => {
                return `
                    <div class="color-legend-item">
                        <div class="color-dot" style="background-color: ${color};"></div>
                        <span>${location}</span>
                    </div>
                `;
            }).join('');

        locationStats.innerHTML = `
            <div class="location-stats">
                ${locationStatsHTML}
            </div>
            ${totalStatsHTML}
            ${colorLegendHTML ? `<div class="color-legend"><h4>탑승지별 색상</h4><div class="color-legend-grid">${colorLegendHTML}</div></div>` : ''}
        `;
    }

    displayPassengerList() {
        const passengerInfo = document.getElementById('passengerInfo');
        
        if (this.passengers.length === 0) {
            passengerInfo.innerHTML = '<p style="color: #7f8c8d; text-align: center;">승객 정보가 없습니다.</p>';
            return;
        }

        // 좌석 번호 순으로 정렬
        const sortedPassengers = [...this.passengers].sort((a, b) => a.seatNumber - b.seatNumber);

        const passengerHTML = sortedPassengers.map(passenger => {
            const statusText = passenger.paymentStatus === 'paid' ? '입금완료' : '입금예정';
            const statusClass = passenger.paymentStatus;

            return `
                <div class="passenger-item ${statusClass}">
                    <div class="passenger-info">
                        <span class="passenger-name">${passenger.name}</span>
                        <span class="passenger-status ${statusClass}">${statusText}</span>
                        <span class="passenger-location">${passenger.location}</span>
                    </div>
                    <div class="seat-number">${passenger.seatNumber}번</div>
                </div>
            `;
        }).join('');

        passengerInfo.innerHTML = passengerHTML;
    }

    clearSeats() {
        const seatElements = document.querySelectorAll('.seat[data-seat]');
        seatElements.forEach(seat => {
            seat.classList.remove('occupied', 'paid', 'pending');
            seat.removeAttribute('data-passenger-name');
            seat.removeAttribute('title');
            // 인라인 스타일 초기화
            seat.style.backgroundColor = '';
            seat.style.borderColor = '';
            seat.style.opacity = '';
        });
    }

    clearAll() {
        // 입력창 초기화
        document.getElementById('textInput').value = '';
        
        // 승객 데이터 및 색상 초기화
        this.passengers = [];
        this.locationColors = {};
        
        // 좌석 상태 초기화
        this.clearSeats();
        
        // 통계 및 승객 목록 초기화
        this.displayLocationStats();
        this.displayPassengerList();
        
        console.log('모든 데이터가 초기화되었습니다.');
    }

    // 통계 정보 제공
    getStatistics() {
        const totalPassengers = this.passengers.length;
        const paidPassengers = this.passengers.filter(p => p.paymentStatus === 'paid').length;
        const pendingPassengers = this.passengers.filter(p => p.paymentStatus === 'pending').length;
        const emptySeats = 28 - totalPassengers;

        return {
            total: totalPassengers,
            paid: paidPassengers,
            pending: pendingPassengers,
            empty: emptySeats
        };
    }

    // 디버깅용 메서드
    debugInfo() {
        console.log('현재 승객 정보:', this.passengers);
        console.log('통계:', this.getStatistics());
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.busSeatManager = new BusSeatManager();
    
    // 예시 데이터 (개발용)
    const exampleData = `1. 김진욱(입완, 양재, 1)
2. 나정선(예정, 사당, 3)
3. 박민수(입완, 강남, 5)
4. 이영희(예정, 서초, 7)
5. 최철수(입완, 논현, 10)`;
    
    // 개발 모드에서 예시 데이터 자동 입력 (주석 해제하여 사용)
    // document.getElementById('textInput').value = exampleData;
    
    console.log('1994 등반대 버스 좌석 배치 시스템이 준비되었습니다.');
    console.log('사용법: 텍스트를 입력하고 "좌석 배치 생성" 버튼을 클릭하세요.');
});
