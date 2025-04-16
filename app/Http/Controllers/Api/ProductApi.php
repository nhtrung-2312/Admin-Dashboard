<?php
 
namespace App\Http\Controllers\Api;
 
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Http\Requests\ProductRequest;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ProductApi extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            // Step 1: Get all products
            $query = Product::query();
    
            // Step 2: Filter by status
            if ($request->has('status')) {
                $status = $request->input('status');
                $query->where('status', $status);
            }
    
            // Step 3: Filter by price
            if ($request->has('price_from')) {
                $query->where('price', '>=', $request->input('price_from'));
            }
    
            if ($request->has('price_to')) {
                $query->where('price', '<=', $request->input('price_to'));
            }
    
            // Step 4: Filter by search
            if ($request->has('search')) {
                $query->where('name', 'like', '%' . $request->input('search') . '%');
            }
    
            // Step 5: Paginate (Choose how many products per page)
            if ($request->has('per_page')) {
                $perPage = $request->input('per_page');
                $query->paginate($perPage);
            }
    
            // Step 6: Sort by date updated
            $query->orderBy('updated_at', 'desc');
    
            // Step 7: Paginate the results (default by 10)
            $perPage = $request->input('per_page', 10);
            $products = $query->paginate($perPage)->withQueryString();
    
            // Step 8: Return the response
            return response()->json([
                'data' => $products->items(),
                'meta' => [
                    'current_page' => $products->currentPage(),
                    'from' => $products->firstItem() ?? 0,
                    'last_page' => $products->lastPage(),
                    'links' => $products->linkCollection()->toArray(),
                    'path' => $products->path(),
                    'per_page' => $products->perPage(),
                    'to' => $products->lastItem() ?? 0,
                    'total' => $products->total(),
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => __('product.system_fetch_error')
            ], 500);
        }
    }
 
    /**
     * Store a newly created resource in storage.
     */
    public function store(ProductRequest $request)
    {
        try {
            //Step 1: Validate the request
            $validatedData = $request->validated();

            //Step 2: Check for upload folder and create if not exists
            $uploadPath = public_path('uploads');
            if (!file_exists($uploadPath)) {
                mkdir($uploadPath, 0755, true);
            }

            //Step 3: Generate ID
            $validatedData['id'] = $this->generateValidId($validatedData['name']);

            //Step 4: Upload image if exists
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $imageName = time() . '.' . $image->getClientOriginalExtension();
                $image->move($uploadPath, $imageName);
                $validatedData['image_url'] = $imageName;
            }

            //Step 4: Create product
            $validatedData['created_at'] = now();
            $validatedData['updated_at'] = now();

            Product::create($validatedData);

            //Step 5: Return response
            return response()->json([
                'message' => __('product.system_create_success')
            ], 200);

        } catch (\Exception $e) {
            //Step 6: Return error response
            // Log::error($e->getMessage());
            return response()->json([
                'message' => __('product.system_create_error')
            ], 500);
        }
    }

    //Generate a valid Id base on first letter and number
    public function generateValidId($name)
    {
        //Keep the character base on regex, remove the rest
        $validateName = preg_replace('/[^a-zA-Z]/', '', $name);

        //Get the first letter, default on 'X'
        $first = strtoupper($validateName[0] ?? 'X');

        //Find the product_id match the first letter, then get the last number
        $usedNumbers = Product::where('id', 'like', "{$first}%")
            ->pluck('id')
            ->map(fn($id) => (int) substr($id, 1))
            ->sort()
            ->values();

        //Create id with correct format
        $newId = $first . str_pad($userdNumbers, 8, '0', STR_PAD_LEFT);

        return $newId;
    }
    
    /**
     * Update the specified resource in storage.
     */
    public function update(ProductRequest $request, string $id)
    {
        // Step 1: Try to validate the updated product
        $product = Product::find($id);
    
        //If not, then return error
        if (!$product) {
            return response()->json([
                'message' => __('product.system_product_not_exist') 
            ], 404);
        }
    
        try {
            // Step 2: Validate the request
            $validated = $request->validated();
    
            //If desc empty, set to null
            $desc = $validated['description'] ?? null;
            if ($desc === 'null' || $desc === '') {
                $desc = null;
            }
    
            // Step 4: Create new data with the validated request
            $data = [
                'name' => $validated['name'],
                'description' => $desc,
                'price' => $validated['price'],
                'quantity' => $validated['quantity'],
                'status' => $validated['status'],
                'updated_at' => now(),
            ];
    
            // Step 5: Handle image
            if ($request->hasFile('image')) {
                //The storage on public/uploads
                $uploadPath = public_path('uploads');
    
                //Create the folder if not exist
                if (!file_exists($uploadPath)) {
                    mkdir($uploadPath, 0755, true);
                }
    
                // Remove the previous image if exist
                if (!empty($product->image_url)) {
                    $oldImagePath = $uploadPath . '/' . $product->image_url;
                    if (file_exists($oldImagePath)) {
                        unlink($oldImagePath);
                    }
                }
    
                //Set the new image, name set to name_date.ext
                $image = $request->file('image');
                $sanitizedName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $validated['name']);
                $imageName = $sanitizedName . '_' . time() . '.' . $image->getClientOriginalExtension();
                $image->move($uploadPath, $imageName);
                $data['image_url'] = $imageName;
            }
    
            // Step 6: Update the data
            $product->update($data);
    
            return response()->json([
                'message' => __('product.system_update_success')
            ], 200);
    
        } catch (\Exception $e) {
            //Log the error if needed
            // Log::error($e->getMessage());
            return response()->json([
                'message' => __('product.system_update_error')
            ], 500);
        }
    }    
 
    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        try {
            //Step 1: Validate the deleted product
            $product = Product::find($id);
            if (!$product) {
                return response()->json([
                    'message' => __('product.system_product_not_exist') 
                ], 404);
            }

            //Step 2: Soft delete product
            $product->delete();

            //Step 3: Return response
            return response()->json([], 200);
        } catch (\Exception $e) {
            //Log the error if needed
            Log::error($e->getMessage());
            
            return response()->json([
                'message' => __('product.system_delete_error')
            ], 500);
        }
    }
}
