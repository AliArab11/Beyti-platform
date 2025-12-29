using System;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

[Table("CustomerFavoriteSeller")]
[Index(nameof(CustomerId), nameof(SellerId), IsUnique = true)]
[Index(nameof(CustomerId))]
[Index(nameof(SellerId))]
public class CustomerFavoriteSeller
{
    public int CustomerId { get; set; }
    public int SellerId { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(CustomerId))]
    public virtual Customer Customer { get; set; } = null!;

    [ForeignKey(nameof(SellerId))]
    public virtual Seller Seller { get; set; } = null!;
}