import React, { useState, useMemo, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox,
  Button, Paper, TextField, InputAdornment, Select, MenuItem, Box, FormControlLabel,
  Switch, IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Pagination from '@mui/material/Pagination';
import { useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import jsonData from './List.json'; // JSON 파일 import
import './ListTable.scss';
import Modal from '../Compo/Modal';

// 테이블 헤더 정의
const headCells = [
  { id: 'category1Name', label: 'Category 1', width: '13%' },
  { id: 'category2Name', label: 'Category 2', width: '13%' },
  { id: 'category3Name', label: 'Category 3', width: '13%' },
  { id: 'itemName', label: '물품명', width: '13%' },
  { id: 'quantity', label: '수량', width: '10%' },
  { id: 'totalPrice', label: '총 가격', width: '10%' },
  { id: 'supplierName', label: '판매자', width: '13%' },
  { id: 'leadtime', label: '리드타임', width: '10%' },
];

// null값 처리 & 가격 단위 구분 함수
const formatCellValue = (value, unit) => {
  if (value == null || value === '') {
    return '-';
  }
  if (unit) {
    switch (unit) {
      case 'USD': return `$ ${value}`;
      case 'KRW': return `₩ ${value}`;
      case 'EUR': return `€ ${value}`;
      case 'JPY': return `¥ ${value}`;
      default: return value;
    }
  }
  return value;
};

// 테이블 헤더 컴포넌트
function EnhancedTableHead({ onSelectAllClick, numSelected, rowCount, allRowsSelected }) {
  return (
    <TableHead
      sx={{
        backgroundColor: '#47464F', '& th': { fontWeight: 'bold', color: '#fff' }
      }}>
      <TableRow>
        <TableCell padding="checkbox" style={{ width: '5%' }}>
          <Checkbox
            color="default"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={allRowsSelected}
            onChange={onSelectAllClick}
          />
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align="center"
            padding='normal'
            style={{ width: headCell.width }}
            className="cursor-pointer"
          >
            {headCell.label}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

// 메인 테이블 컴포넌트
function ListTableDB() {
  const navigate = useNavigate();
  const [initialRows, setInitialRows] = useState([]);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1); // 현재 페이지
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [category1Name, setCategoryName] = useState('');
  const [category2Name, setCategory2Name] = useState('');
  const [category3Name, setCategory3Name] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // 장바구니로 이동 물어보기 모달상태
  const [leadTimeModalOpen, setLeadTimeModalOpen] = useState(false);
  const [selectedLeadTimeData, setSelectedLeadTimeData] = useState([]);
  const [showSelected, setShowSelected] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState({}); // 선택된 공급업체 상태

   // 사용자 이름을 로컬 스토리지에서 가져옴
   const username = localStorage.getItem('username') || 'Guest';
   const token = localStorage.getItem('token');

   const generateKey = (row) => {
    return `${row.category1Name}-${row.category2Name}-${row.category3Name}-${row.itemName}`;
  };

  // useEffect(() => {
  //   const data = jsonData.finditem.map(item => ({
  //     ...item,
  //     quantity: 1,
  //     leadtime: 1
  //   }));
  //   setInitialRows(data);
  //   setRows(data);
  // }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/finditem',
        {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
        }
        );
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
      
        const processedData = data.map(item => ({
          ...item,
          quantity: 1,
          leadtime: 1
        }));
        setInitialRows(processedData);
        setRows(processedData);
      } catch (error) {
        console.error('데이터 로딩 중 오류 발생:', error);
      }
    };
  
    fetchData();
  }, []);

  const category1Options = [...new Set(rows.map((row) => row.category1Name))];
  
  const category2Options = useMemo(() => {
    return [...new Set(rows.filter((row) => row.category1Name === category1Name).map((row) => row.category2Name))];
  }, [category1Name, rows]);

  const category3Options = useMemo(() => {
    return [...new Set(rows.filter((row) => row.category2Name === category2Name).map((row) => row.category3Name))];
  }, [category2Name, rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesCategory1 = category1Name ? row.category1Name === category1Name : true;
      const matchesCategory2 = category2Name ? row.category2Name === category2Name : true;
      const matchesCategory3 = category3Name ? row.category3Name === category3Name : true;
      const matchesSearchQuery = searchQuery ?
        row.itemName.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      return matchesCategory1 && matchesCategory2 && matchesCategory3 && matchesSearchQuery;
    });
  }, [rows, category1Name, category2Name, category3Name, searchQuery, showSelected]);

  const filteredRowsBySelection = useMemo(() => {
    return showSelected ? filteredRows.filter(row => selected.has(row.itemId)) : filteredRows;
  }, [filteredRows, showSelected, selected]);

  const uniqueRows = useMemo(() => {
    const seen = new Set();
    return filteredRowsBySelection.filter(row => {
      const key = `${row.category1Name}-${row.category2Name}-${row.category3Name}-${row.itemName}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [filteredRowsBySelection]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, category1Name, category2Name, category3Name, rowsPerPage, showSelected]);

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = new Set(uniqueRows.map((row) => row.itemId));
      setSelected((prevSelected) => new Set([...prevSelected, ...newSelected]));
    } else {
      setSelected((prevSelected) => {
        const newSelected = new Set(
          [...prevSelected].filter(item => !uniqueRows.some(row => row.itemId === item))
        );
        return newSelected;
      });
    }
  };

  const handleClick = (event, itemName) => {
    const newSelected = new Set(selected);
    if (newSelected.has(itemName)) {
      newSelected.delete(itemName);
    } else {
      newSelected.add(itemName);
    }
    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  const handleCategory1Change = (event) => {
    setCategoryName(event.target.value);
    setCategory2Name('');
    setCategory3Name('');
  };

  const handleCategory2Change = (event) => {
    setCategory2Name(event.target.value);
    setCategory3Name('');
  };

  const handleCategory3Change = (event) => {
    setCategory3Name(event.target.value);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleQuantityChange = (itemId, event) => {
    const newQuantity = Math.max(1, parseInt(event.target.value, 10));
    setRows(rows.map(row =>
      row.itemId === itemId ? { ...row, quantity: newQuantity } : row
    ));
  };

  // 빈 행 계산
  const emptyRows = useMemo(() => {
    const rowsCount = showSelected ? filteredRowsBySelection.length : filteredRows.length;
    return page > 1 ? Math.max(0, (page - 1) * rowsPerPage + rowsPerPage - rowsCount) : 0;
  }, [page, rowsPerPage, filteredRows.length, filteredRowsBySelection.length, showSelected]);

  // 총 페이지 수 계산
  const totalPages = useMemo(() => {
    const rowsCount = showSelected ? filteredRowsBySelection.length : filteredRows.length;
    return Math.ceil(rowsCount / rowsPerPage);
  }, [filteredRows.length, filteredRowsBySelection.length, rowsPerPage, showSelected]);

  const allRowsSelected = useMemo(() => {
    return uniqueRows.length > 0 && uniqueRows.every(row => selected.has(row.itemId));
  }, [uniqueRows, selected]);

  const openModal = () => setModalOpen(true);

  const handleSearchReset = () => {
    setSearchQuery('');
    setRows(initialRows);
  };

  const handleSearchButtonClick = () => {
    setRows(filteredRows);
    setPage(1);
  };

  // 공급업체를 선택할 때 현재 선택된 품목의 공급업체를 변경 (같은 itemName이라도 다른 물품이면 다른 supplier 고를 수 있음)
  const handleSupplierChange = (itemId, supplierName) => {
    setSelectedSupplier(prev => ({
      ...prev,
      [itemId]: supplierName
    }));
  };

  // 공통 데이터 조회 함수
  const getRowData = (row) => {
    return rows.find(
      r =>
        r.category1Name === row.category1Name &&
        r.category2Name === row.category2Name &&
        r.category3Name === row.category3Name &&
        r.itemName === row.itemName
    ) || {};
  };

  // 로그인한 사용자별 장바구니 추가 함수
  const handleAddToCart = async () => {
    console.log('장바구니 담기 버튼 클릭됨');
    const cartItems = uniqueRows
      .filter(row => selected.has(row.itemId))
      .map(row => ({
        itemsId: row.itemId,
        quantity: row.quantity
      }));

    console.log('전송할 장바구니 아이템:', cartItems);

    try {
      const response = await fetch('/goCart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cartItems),
      });

      if (response.ok) {
        console.log('장바구니 추가 성공');
        setIsModalOpen(true);
      } else {
        console.error('장바구니 추가 실패:', response.statusText);
      }
    } catch (error) {
      console.error('장바구니 추가 중 오류 발생:', error);
    }
  };

  // 모달의 '장바구니로 이동' 버튼 클릭 시 동작
  const handleNavigateToCart = () => {
    setIsModalOpen(false);
    navigate('/order');
  };

  return (
    <div className="list-table-root flex flex-col p-6">
      <div className="text-xl font-semibold text-white mb-4">물품 리스트</div>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <Select
            value={category1Name}
            onChange={handleCategory1Change}
            displayEmpty
            className="select-custom"
          >
            <MenuItem value=""><div>Categories 1</div></MenuItem>
            {category1Options.map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
          <Select
            value={category2Name}
            onChange={handleCategory2Change}
            displayEmpty
            className="select-custom"
          >
            <MenuItem value=""><div>Categories 2</div></MenuItem>
            {category2Options.map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
          <Select
            value={category3Name}
            onChange={handleCategory3Change}
            displayEmpty
            className="select-custom"
          >
            <MenuItem value=""><div>Categories 3</div></MenuItem>
            {category3Options.map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
          <TextField
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="물품명 검색"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'white', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {searchQuery && (
                    <IconButton
                      onClick={handleSearchReset}
                      edge="end"
                      sx={{ color: 'white' }}
                    >
                      <CloseIcon sx={{ color: 'white', fontSize: 20 }} />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            }}
            className='custom-textfield'
          />
          <FormControlLabel
            control={<Switch checked={showSelected} onChange={() => setShowSelected(!showSelected)} />}
            label={showSelected ? '선택 품목 보기' : '전체 품목 보기'}
            className="custom-toggle"
          />
        </div>
        <Button
          onClick={handleSearchButtonClick}
          variant="contained"
          className="bluebutton"
        >
          검색
        </Button>
      </div>

      <div className="bg-custom">
        <TableContainer component={Paper} sx={{ minHeight: '400px', width: '100%' }}>
          <Table>
            <EnhancedTableHead
              onSelectAllClick={handleSelectAllClick}
              numSelected={selected.size}
              rowCount={uniqueRows.length}
              allRowsSelected={allRowsSelected}
            />
            <TableBody>
              {uniqueRows.slice((page - 1) * rowsPerPage, page * rowsPerPage).map((row) => (
                <TableRow
                key={generateKey(row)}
                hover
                selected={selected.has(row.itemId)}
              >
                <TableCell padding="checkbox" style={{ width: '5%' }}>
                  <Checkbox
                    checked={selected.has(row.itemId)}
                    inputProps={{ 'aria-labelledby': row.itemId }}
                    onChange={() => handleClick(null, row.itemId)} // 체크박스를 클릭할 때만 처리
                  />
                </TableCell>
                  <TableCell align="center" className="item-cell">{formatCellValue(row.category1Name)}</TableCell>
                  <TableCell align="center" className="item-cell">{formatCellValue(row.category2Name)}</TableCell>
                  <TableCell align="center" className="item-cell">{formatCellValue(row.category3Name)}</TableCell>
                  <TableCell align="center" className="item-cell">{formatCellValue(row.itemName)}</TableCell>
                  <TableCell align="center" className="item-cell">
                    <TextField
                      className="custom-quantity"
                      type="number"
                      value={row.quantity}
                      onChange={(event) => handleQuantityChange(row.itemId, event)}
                      inputProps={{ min: 1 }}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  {/* 공급업체에 대한 가격 */}
                  <TableCell 
                    align="center" 
                    className={`price-cell ${!selectedSupplier[row.itemId] ? 'price-cell-no-price' : ''}`}
                  >
                    {(() => {
                      // 현재 선택된 공급업체의 데이터 찾기
                      const supplierName = selectedSupplier[row.itemId];
                      const data = rows.find(r =>
                        r.category1Name === row.category1Name &&
                        r.category2Name === row.category2Name &&
                        r.category3Name === row.category3Name &&
                        r.itemName === row.itemName &&
                        r.supplierName === supplierName
                      ) || {};

                      // 가격과 단위 설정
                      const price = data.price || 0; // 데이터에서 가격을 찾고, 없으면 0으로 설정
                      const unit = data.unit || '';

                      // 가격 표시
                      const displayPrice = supplierName
                        ? formatCellValue(row.quantity * price, unit) // 공급업체가 선택되면 계산된 가격 표시
                        : '-'; // 공급업체가 선택되지 않으면 '-' 표시

                      return displayPrice;
                    })()}
                  </TableCell>
                  {/* category1,2,3, itemName이 일치하는 항목에 대한 판매자 목록 */}
                  <TableCell align="center" className='item-cell'>
                    <Select
                      className="select-supplier"
                      value={selectedSupplier[row.itemId] || ''}
                      onChange={(event) => handleSupplierChange(row.itemId, event.target.value)}
                      size="small"
                    >
                      {[...new Set(rows
                        .filter(r =>
                          r.category1Name === row.category1Name &&
                          r.category2Name === row.category2Name &&
                          r.category3Name === row.category3Name &&
                          r.itemName === row.itemName
                        )
                        .map(r => r.supplierName))
                      ].map((supplierName) => (
                        <MenuItem 
                          key={`${row.itemId}-${supplierName}`}
                          value={supplierName}
                        >
                          {supplierName}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>

                  <TableCell align="center" style={{ width: '9%' }}>
                      <Button
                        onClick={() => (row.leadtime)}
                        variant="contained"
                        className="greenbutton"
                      >
                        리드타임
                      </Button>
                    </TableCell>
                </TableRow>
              ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
      <div className="pagination-container">
      <Pagination
          count={totalPages}
          page={page}
          onChange={handleChangePage}
          variant="outlined"
          shape="rounded"
        />
      </div>
      <div className='flex justify-between items-center mt-6'>
        <div className="flex gap-4">
          {/* 페이지당 항목 수 선택 */}
          <Select
            value={rowsPerPage}
            onChange={handleChangeRowsPerPage}
            className="select-custom"
          >
            {[5, 10, 15].map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </div>
        <div className="flex gap-4">
          {/* 장바구니 담기 버튼 */}
          <Button
            className='bluebutton2'
            onClick={handleAddToCart}>
            장바구니 담기
          </Button>

          {/* 모달 컴포넌트 */}
          <Modal
            open={isModalOpen}
            setOpen={setIsModalOpen}
            title="장바구니 추가 성공"
            footer={
              <div>
                <button onClick={handleNavigateToCart} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">
                  장바구니로 이동
                </button>
                <button onClick={() => setIsModalOpen(false)} className="bg-gray-400 text-white px-4 py-2 rounded">
                  닫기
                </button>
              </div>
            }
          >
            장바구니에 아이템이 추가되었습니다. 장바구니로 이동하시겠습니까?
          </Modal>
        </div>
      </div>
      {/* 리드타임 모달 */}
      {/* <LeadTimeModal
        open={leadTimeModalOpen}
        setOpen={setLeadTimeModalOpen}
        leadTimeData={selectedLeadTimeData} // 선택된 리드타임 데이터 전달
      /> */}
    </div>
  );
}

export default ListTableDB;